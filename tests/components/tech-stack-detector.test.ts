import { describe, expect, it } from 'vitest';
import { detectTechStackFromSignals } from '@/components/TechStackDetection/detector';
import {
  adversarialFixtures,
  emptySignals,
  productionStyleFixtures,
} from '../fixtures/tech-stack-signals';

describe('tech-stack detector', () => {
  it.each(productionStyleFixtures)('detects $name from independent evidence', fixture => {
    const hits = detectTechStackFromSignals(fixture.signals);
    fixture.expected.forEach(key => {
      const hit = hits.find(item => item.key === key);
      expect(hit, `expected ${key} in ${fixture.name}`).toBeTruthy();
      expect(hit?.evidence.length).toBeGreaterThan(0);
      expect(['high', 'medium']).toContain(hit?.confidence);
    });
  });

  it.each(adversarialFixtures)('does not misidentify $name', fixture => {
    const keys = detectTechStackFromSignals(fixture.signals).map(item => item.key);
    fixture.rejected.forEach(key => expect(keys).not.toContain(key));
  });

  it('matches exact runtime identifiers instead of substrings', () => {
    const hits = detectTechStackFromSignals({
      ...emptySignals(),
      globals: ['__REACT_DEVTOOLS_GLOBAL_HOOK__'],
      runtime: ['react-renderer-extension-placeholder'],
    });
    expect(hits.some(item => item.key === 'react')).toBe(false);
  });

  it('counts correlated markup evidence once', () => {
    const hit = detectTechStackFromSignals({
      ...emptySignals(),
      selectors: ['__next_data_script', 'next_root'],
      content: ['__next_data__', '__next_f', 'next-route-announcer'],
      scripts: ['https://example.com/_next/static/chunks/main.js'],
    }).find(item => item.key === 'nextjs');
    expect(hit).toBeTruthy();
    expect(hit?.score).toBe(5);
    expect(hit?.confidence).toBe('medium');
  });

  it('detects ecosystem libraries only from decisive or independent evidence', () => {
    const hits = detectTechStackFromSignals({
      ...emptySignals(),
      globals: ['axios'],
      scripts: ['https://cdn.example.com/vue-router.min.js'],
      content: ['createwebhistory('],
      versions: { axios: '1.8.2' },
    });
    expect(hits.some(item => item.key === 'axios')).toBe(true);
    expect(hits.some(item => item.key === 'vue-router')).toBe(true);
    expect(hits.some(item => item.key === 'redux')).toBe(false);
  });

  it('returns no hits when no supported evidence exists', () => {
    expect(detectTechStackFromSignals(emptySignals())).toEqual([]);
  });
});
