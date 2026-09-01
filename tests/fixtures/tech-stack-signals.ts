import type { ProbeSignals } from '@/components/TechStackDetection/detector';

export const emptySignals = (): ProbeSignals => ({
  scripts: [],
  links: [],
  scriptTypes: [],
  globals: [],
  selectors: [],
  metas: [],
  htmlAttrs: [],
  content: [],
  resources: [],
  runtime: [],
});

export const productionStyleFixtures = [
  {
    name: 'React production runtime',
    expected: ['react'],
    signals: {
      ...emptySignals(),
      runtime: ['react-renderer'],
      selectors: ['react_dom_marker'],
      versions: { react: '19.1.1' },
    },
  },
  {
    name: 'Vue production runtime',
    expected: ['vue'],
    signals: {
      ...emptySignals(),
      runtime: ['vue-app'],
      selectors: ['vue_app_marker', 'vue_sfc_marker'],
      versions: { vue: '3.5.20' },
    },
  },
  {
    name: 'Angular production runtime',
    expected: ['angular'],
    signals: {
      ...emptySignals(),
      runtime: ['angular-runtime'],
      selectors: ['ng_version_marker'],
      htmlAttrs: ['ng-version=20.1.0'],
      versions: { angular: '20.1.0' },
    },
  },
  {
    name: 'Next.js hydrated page',
    expected: ['nextjs'],
    signals: {
      ...emptySignals(),
      runtime: ['next-runtime'],
      selectors: ['__next_data_script', 'next_root'],
      scripts: ['https://example.com/_next/static/chunks/main-a1b2.js'],
      content: ['__next_data__'],
    },
  },
  {
    name: 'Nuxt hydrated page',
    expected: ['nuxt'],
    signals: {
      ...emptySignals(),
      runtime: ['nuxt-runtime'],
      selectors: ['__nuxt_data_script', 'nuxt_root'],
      scripts: ['https://example.com/_nuxt/entry.a1b2.js'],
    },
  },
  {
    name: 'Webpack runtime bundle',
    expected: ['webpack'],
    signals: {
      ...emptySignals(),
      runtime: ['webpack-runtime'],
      scripts: ['https://example.com/static/js/runtime.a1b2.js'],
      content: ['webpackchunk'],
    },
  },
  {
    name: 'Vite development runtime',
    expected: ['vite'],
    signals: {
      ...emptySignals(),
      scripts: ['http://localhost:5173/@vite/client'],
      scriptTypes: ['module'],
      content: ['import.meta.hot'],
    },
  },
] satisfies Array<{ name: string; expected: string[]; signals: ProbeSignals }>;

export const adversarialFixtures = [
  {
    name: 'vanilla app with a generic root',
    rejected: ['react'],
    signals: { ...emptySignals(), selectors: ['react_root'] },
  },
  {
    name: 'native ES module page',
    rejected: ['vite'],
    signals: { ...emptySignals(), scriptTypes: ['module'] },
  },
  {
    name: 'generic static asset layout',
    rejected: ['webpack'],
    signals: { ...emptySignals(), scripts: ['https://example.com/static/js/main.js'] },
  },
  {
    name: 'empty DevTools hooks injected by extensions',
    rejected: ['react', 'vue'],
    signals: {
      ...emptySignals(),
      globals: ['__REACT_DEVTOOLS_GLOBAL_HOOK__', '__VUE_DEVTOOLS_GLOBAL_HOOK__'],
    },
  },
  {
    name: 'documentation containing common API names',
    rejected: ['rxjs', 'tanstack-query', 'vue', 'axios'],
    signals: {
      ...emptySignals(),
      content: ['subject(', 'usequery(', 'createapp(', 'axios.create('],
    },
  },
] satisfies Array<{ name: string; rejected: string[]; signals: ProbeSignals }>;
