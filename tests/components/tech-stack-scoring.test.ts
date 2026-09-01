import { describe, expect, it } from 'vitest';
import {
  buildSignalPool,
  normalizeVersions,
  scoreCandidate,
  sortTechStackHits,
} from '@/components/TechStackDetection/scoring';
import type { ProbeSignals, SignatureCandidate } from '@/components/TechStackDetection/types';

const emptySignals = (): ProbeSignals => ({
  scripts: [],
  links: [],
  scriptTypes: [],
  globals: [],
  selectors: [],
  metas: [],
  htmlAttrs: [],
  content: [],
});

const candidate: SignatureCandidate = {
  key: 'example',
  name: 'Example',
  category: 'library',
  versionKeys: ['example'],
  signatures: [
    {
      source: 'globals',
      pattern: 'Example',
      weight: 3,
      operator: 'equals',
      group: 'runtime',
      decisive: true,
    },
    {
      source: 'scripts',
      pattern: 'example',
      weight: 1,
      operator: 'contains',
      group: 'asset',
      decisive: false,
    },
  ],
};

describe('tech-stack scoring boundaries', () => {
  it('normalizes signal lists and version keys before matching', () => {
    const signals = { ...emptySignals(), globals: [' Example '], scripts: [' /EXAMPLE.js '] };
    expect(buildSignalPool(signals).globals).toEqual(['example']);
    expect(buildSignalPool(signals).scripts).toEqual(['/example.js']);
    expect(normalizeVersions({ Example: ' 1.2.3 ' })).toEqual({ example: '1.2.3' });
  });

  it('adds version evidence without double-counting the runtime group', () => {
    const hit = scoreCandidate(
      candidate,
      buildSignalPool({
        ...emptySignals(),
        globals: ['Example'],
        scripts: ['https://x/example.js'],
      }),
      { example: '1.2.3' }
    );
    expect(hit).toMatchObject({ key: 'example', score: 4, confidence: 'high' });
    expect(hit?.evidence).toEqual([
      'global: example',
      'script: https://x/example.js',
      'version: example@1.2.3',
    ]);
  });

  it('sorts score ties by stable localized display name', () => {
    const hits = sortTechStackHits([
      { key: 'z', name: 'Zed', category: 'library', score: 2, confidence: 'low', evidence: [] },
      { key: 'a', name: 'Alpha', category: 'library', score: 2, confidence: 'low', evidence: [] },
    ]);
    expect(hits.map(hit => hit.key)).toEqual(['a', 'z']);
  });
});
