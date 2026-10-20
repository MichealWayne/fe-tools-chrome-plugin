import type {
  ProbeSignals,
  SignalSource,
  SignatureCandidate,
  SignatureRule,
  TechStackHit,
  VersionObservation,
} from './types';
import { collectVersionObservations, normalizeVersion, redactUrl } from './versions';

export type SignalPool = Record<SignalSource, string[]>;

export const normalizeSignalList = (input: string[] | undefined): string[] =>
  (Array.isArray(input) ? input : [])
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .map(item => item.toLowerCase());

export const buildSignalPool = (signals: ProbeSignals): SignalPool => ({
  scripts: normalizeSignalList(signals.scripts?.map(value => redactUrl(value))),
  links: normalizeSignalList(signals.links?.map(value => redactUrl(value))),
  scriptTypes: normalizeSignalList(signals.scriptTypes),
  globals: normalizeSignalList(signals.globals),
  selectors: normalizeSignalList(signals.selectors),
  metas: normalizeSignalList(signals.metas),
  htmlAttrs: normalizeSignalList(signals.htmlAttrs),
  content: normalizeSignalList(signals.content),
  resources: normalizeSignalList(signals.resources?.map(value => redactUrl(value))),
  runtime: normalizeSignalList(signals.runtime),
});

export const normalizeVersions = (versions: Record<string, string> | undefined) =>
  Object.entries(versions || {}).reduce(
    (acc, [key, value]) => {
      const version = normalizeVersion(value);
      if (version) acc[key.toLowerCase()] = version;
      return acc;
    },
    {} as Record<string, string>
  );

const toConfidence = (score: number, groupCount: number, hasDecisive: boolean) => {
  if ((hasDecisive && groupCount >= 2) || groupCount >= 3 || score >= 7) {
    return 'high' as const;
  }
  if (hasDecisive || score >= 4) {
    return 'medium' as const;
  }
  return 'low' as const;
};

const sourceLabel: Record<SignalSource, string> = {
  scripts: 'script',
  links: 'link',
  scriptTypes: 'script-type',
  globals: 'global',
  selectors: 'dom',
  metas: 'meta',
  htmlAttrs: 'attr',
  content: 'content',
  resources: 'resource',
  runtime: 'runtime',
};

const findByPattern = (items: string[], rule: SignatureRule) => {
  const pattern = rule.pattern.toLowerCase();
  const matchValue = (item: string) =>
    ['scripts', 'links', 'resources'].includes(rule.source)
      ? new URL(item, 'https://relative.invalid').pathname
      : item;
  if (rule.operator === 'equals') {
    return items.find(item => matchValue(item) === pattern);
  }
  if (rule.operator === 'regex') {
    const expression = new RegExp(pattern, 'i');
    return items.find(item => expression.test(matchValue(item)));
  }
  return items.find(item => matchValue(item).includes(pattern));
};

const sumGroupScores = (groupScores: Map<SignatureRule['group'], number>) =>
  Array.from(groupScores.values()).reduce((total, value) => total + value, 0);

export const scoreCandidate = (
  candidate: SignatureCandidate,
  signalPool: SignalPool,
  versions: Record<string, string>,
  observations: VersionObservation[] = []
): TechStackHit | null => {
  let hasDecisive = false;
  const evidence = new Set<string>();
  const groupScores = new Map<SignatureRule['group'], number>();

  candidate.signatures.forEach(rule => {
    const matched = findByPattern(signalPool[rule.source], rule);
    if (!matched) return;
    groupScores.set(rule.group, Math.max(groupScores.get(rule.group) || 0, rule.weight));
    hasDecisive ||= rule.decisive;
    evidence.add(`${sourceLabel[rule.source]}: ${matched}`);
  });

  let score = sumGroupScores(groupScores);
  const matchedVersions = observations.filter(item => item.technology === candidate.key);
  (candidate.versionKeys || []).forEach(versionKey => {
    const version = versions[versionKey.toLowerCase()];
    if (!version) return;
    groupScores.set('runtime', Math.max(groupScores.get('runtime') || 0, 3));
    score = sumGroupScores(groupScores);
    hasDecisive = true;
    evidence.add(`version: ${versionKey}@${version}`);
  });

  matchedVersions
    .filter(item => item.source !== 'asset')
    .forEach(item => {
      const group = item.source === 'dom' ? 'markup' : 'runtime';
      groupScores.set(group, Math.max(groupScores.get(group) || 0, 3));
      hasDecisive = true;
    });
  score = sumGroupScores(groupScores);

  if (score <= 0 || (!hasDecisive && groupScores.size < 2)) return null;
  return {
    key: candidate.key,
    name: candidate.name,
    category: candidate.category,
    score,
    confidence: toConfidence(score, groupScores.size, hasDecisive),
    evidence: Array.from(evidence),
    versions: matchedVersions,
    versionConflict: new Set(matchedVersions.map(item => item.version)).size > 1,
  };
};

export const sortTechStackHits = (hits: TechStackHit[]): TechStackHit[] =>
  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

export const detectFromCandidates = (
  signals: ProbeSignals,
  candidates: SignatureCandidate[]
): TechStackHit[] => {
  const signalPool = buildSignalPool(signals);
  const observations = collectVersionObservations(signals);
  return sortTechStackHits(
    candidates
      .map(candidate => scoreCandidate(candidate, signalPool, {}, observations))
      .filter((hit): hit is TechStackHit => Boolean(hit))
  );
};
