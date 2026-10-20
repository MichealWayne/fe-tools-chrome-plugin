import type { ProbeSignals, VersionObservation } from './types';

// Versions must be explicit numeric releases, never build IDs or arbitrary labels.
const VERSION =
  /^\d{1,4}\.\d{1,4}(?:\.\d{1,4})?(?:-[0-9a-z][0-9a-z.-]*)?(?:\+[0-9a-z][0-9a-z.-]*)?$/i;

export const normalizeVersion = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.length > 64) return undefined;
  const version = value.trim().replace(/^v(?=\d)/, '');
  return VERSION.test(version) ? version : undefined;
};

/** Removes URL credentials, queries and fragments before matching or sharing evidence. */
export const redactUrl = (value: string): string => {
  try {
    const url = new URL(value, 'https://relative.invalid');
    if (!['http:', 'https:'].includes(url.protocol)) return '[resource]';
    return value.startsWith('/') || !/^[a-z][a-z\d+.-]*:/i.test(value)
      ? url.pathname
      : `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return '[resource]';
  }
};

export const normalizeVersionObservations = (input: unknown): VersionObservation[] => {
  if (!Array.isArray(input)) return [];
  const observations = new Map<string, VersionObservation>();
  input.slice(0, 200).forEach(item => {
    if (!item || typeof item !== 'object') return;
    const version = normalizeVersion(item.version);
    if (!version || typeof item.technology !== 'string' || typeof item.detail !== 'string') return;
    const technology = item.technology.toLowerCase();
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(technology)) return;
    if (!['runtime', 'dom', 'devtools', 'asset'].includes(item.source)) return;
    const observation: VersionObservation = {
      technology,
      version,
      source: item.source,
      detail: item.source === 'asset' ? redactUrl(item.detail) : item.detail.slice(0, 160),
      confidence: item.source === 'asset' ? 'low' : item.source === 'devtools' ? 'medium' : 'high',
    };
    observations.set(JSON.stringify(observation), observation);
  });
  return Array.from(observations.values());
};

const packages: Record<string, string> = {
  vue: 'vue',
  react: 'react',
  angular: 'angularjs',
  '@angular/core': 'angular',
  jquery: 'jquery',
  axios: 'axios',
  next: 'nextjs',
  nuxt: 'nuxt',
  'vue-router': 'vue-router',
  pinia: 'pinia',
  'element-plus': 'element-plus',
  antd: 'antd',
  bootstrap: 'bootstrap',
  echarts: 'echarts',
  'chart.js': 'chartjs',
  'monaco-editor': 'monaco',
  codemirror: 'codemirror',
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Extracts only explicit package releases from known package URL forms. */
export const collectVersionObservations = (signals: ProbeSignals): VersionObservation[] => {
  const observations = normalizeVersionObservations(signals.versionObservations);
  Object.entries(signals.versions || {}).forEach(([technology, version]) => {
    if (observations.some(item => item.technology === technology.toLowerCase())) return;
    observations.push({
      technology,
      version,
      source: 'runtime',
      detail: 'public version field',
      confidence: 'high',
    });
  });
  const assets = new Set([...(signals.scripts || []), ...(signals.links || [])]);
  assets.forEach(asset => {
    const detail = redactUrl(asset);
    // Scope matching to paths: a host, search term or query mentioning a package is not evidence.
    const path = new URL(detail, 'https://relative.invalid').pathname;
    Object.entries(packages).forEach(([name, technology]) => {
      const escaped = escapeRegex(name);
      const patterns = [
        new RegExp(`(?:^|/)${escaped}@([^/]+)(?:/|$)`, 'i'),
        new RegExp(`(?:^|/)${escaped}/([^/]+)(?:/|$)`, 'i'),
        new RegExp(`(?:^|/)${escaped}-([0-9]+\\.[0-9]+\\.[0-9]+)(?:\\.min)?\\.(?:js|css)$`, 'i'),
      ];
      const version = patterns
        .map(pattern => normalizeVersion(path.match(pattern)?.[1]))
        .find(Boolean);
      if (version)
        observations.push({ technology, version, source: 'asset', detail, confidence: 'low' });
    });
  });
  return normalizeVersionObservations(observations);
};
