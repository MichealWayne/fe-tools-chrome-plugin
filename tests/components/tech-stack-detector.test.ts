import { describe, expect, it } from 'vitest';
import { detectTechStackFromSignals, type ProbeSignals } from '@/components/TechStackDetection/detector';

const baseSignals = (): ProbeSignals => ({
  scripts: [],
  links: [],
  scriptTypes: [],
  globals: [],
  selectors: [],
  metas: [],
  htmlAttrs: [],
  content: [],
});

describe('tech-stack detector', () => {
  it('detects framework hits with confidence and evidence', () => {
    const signals: ProbeSignals = {
      ...baseSignals(),
      globals: ['__NEXT_DATA__', '__REACT_DEVTOOLS_GLOBAL_HOOK__'],
      selectors: ['__next_data_script'],
      scripts: ['https://cdn.example.com/_next/static/chunk.js'],
      versions: {
        react: '18.3.1',
      },
    };

    const hits = detectTechStackFromSignals(signals);

    const nextHit = hits.find(item => item.key === 'nextjs');
    const reactHit = hits.find(item => item.key === 'react');

    expect(nextHit).toBeTruthy();
    expect(nextHit?.confidence).toBe('high');
    expect(nextHit?.evidence.length).toBeGreaterThan(0);
    expect(nextHit?.evidence.some(item => item.includes('global'))).toBe(true);

    expect(reactHit).toBeTruthy();
    expect(reactHit?.confidence === 'high' || reactHit?.confidence === 'medium').toBe(true);
    expect(reactHit?.evidence.some(item => item.includes('version: react@18.3.1'))).toBe(true);
  });

  it('detects bundler and sub-library signals', () => {
    const signals: ProbeSignals = {
      ...baseSignals(),
      globals: ['__webpack_require__', 'axios', '__REDUX_DEVTOOLS_EXTENSION__'],
      scripts: [
        'https://cdn.example.com/static/js/webpack.runtime.js',
        'https://cdn.example.com/libs/vue-router.min.js',
      ],
    };

    const hits = detectTechStackFromSignals(signals);

    expect(hits.some(item => item.key === 'webpack')).toBe(true);
    expect(hits.some(item => item.key === 'axios')).toBe(true);
    expect(hits.some(item => item.key === 'redux')).toBe(true);
    expect(hits.some(item => item.key === 'vue-router')).toBe(true);
  });

  it('returns empty hits when no supported signals exist', () => {
    const hits = detectTechStackFromSignals(baseSignals());
    expect(hits).toEqual([]);
  });

  it('supports multi-stack hit results in one page', () => {
    const signals: ProbeSignals = {
      ...baseSignals(),
      globals: ['Vue', '__VUE_DEVTOOLS_GLOBAL_HOOK__', '__webpack_require__', 'axios'],
      selectors: ['vue_app_marker'],
      scripts: ['https://cdn.example.com/assets/main.vite.js'],
      versions: {
        vue: '3.5.0',
        axios: '1.8.2',
      },
    };

    const hits = detectTechStackFromSignals(signals);
    expect(hits.some(item => item.key === 'vue')).toBe(true);
    expect(hits.some(item => item.key === 'webpack')).toBe(true);
    expect(hits.some(item => item.key === 'axios')).toBe(true);
  });

  it('detects by content signals when url/global markers are weak', () => {
    const signals: ProbeSignals = {
      ...baseSignals(),
      content: ['createapp(', 'createpinia(', 'axios.create('],
    };

    const hits = detectTechStackFromSignals(signals);
    expect(hits.some(item => item.key === 'vue')).toBe(true);
    expect(hits.some(item => item.key === 'pinia')).toBe(true);
    expect(hits.some(item => item.key === 'axios')).toBe(true);
  });

  it('detects weak DOM/script markers with low or medium confidence', () => {
    const signals: ProbeSignals = {
      ...baseSignals(),
      selectors: ['react_root', 'vue_sfc_marker'],
      scripts: ['https://cdn.example.com/static/js/main.js'],
    };

    const hits = detectTechStackFromSignals(signals);
    expect(hits.some(item => item.key === 'react')).toBe(true);
    expect(hits.some(item => item.key === 'vue')).toBe(true);
  });

  it('detects additional ecosystems from link, script-type, and html attrs', () => {
    const signals: ProbeSignals = {
      ...baseSignals(),
      links: ['/_astro/chunk.js', 'https://cdn.example.com/libs/apollo-client.js'],
      scriptTypes: ['module'],
      htmlAttrs: ['x-data', 'data-controller'],
      content: ['queryclientprovider', 'window.__remixcontext'],
    };

    const hits = detectTechStackFromSignals(signals);
    expect(hits.some(item => item.key === 'astro')).toBe(true);
    expect(hits.some(item => item.key === 'alpinejs')).toBe(true);
    expect(hits.some(item => item.key === 'stimulus')).toBe(true);
    expect(hits.some(item => item.key === 'tanstack-query')).toBe(true);
    expect(hits.some(item => item.key === 'apollo-client')).toBe(true);
    expect(hits.some(item => item.key === 'remix')).toBe(true);
  });
});
