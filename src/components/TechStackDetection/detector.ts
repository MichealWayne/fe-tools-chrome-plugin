export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type ProbeSignals = {
  scripts: string[];
  links: string[];
  scriptTypes: string[];
  globals: string[];
  selectors: string[];
  metas: string[];
  htmlAttrs: string[];
  content: string[];
  versions?: Record<string, string>;
};

export type TechStackHit = {
  key: string;
  name: string;
  category: 'framework' | 'bundler' | 'library';
  confidence: ConfidenceLevel;
  score: number;
  evidence: string[];
};

type SignalSource =
  | 'scripts'
  | 'links'
  | 'scriptTypes'
  | 'globals'
  | 'selectors'
  | 'metas'
  | 'htmlAttrs'
  | 'content';

type SignatureRule = {
  source: SignalSource;
  pattern: string;
  weight: number;
};

type SignatureCandidate = {
  key: string;
  name: string;
  category: TechStackHit['category'];
  signatures: SignatureRule[];
  versionKeys?: string[];
};

const normalizeList = (input: string[] | undefined) =>
  (Array.isArray(input) ? input : [])
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .map(item => item.toLowerCase());

const toConfidence = (score: number, strongCount: number): ConfidenceLevel => {
  if (strongCount >= 2 || (strongCount >= 1 && score >= 5) || score >= 7) {
    return 'high';
  }
  if (score >= 3) {
    return 'medium';
  }
  return 'low';
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
};

const findByPattern = (items: string[], pattern: string) =>
  items.find(item => item.includes(pattern.toLowerCase()));

const sig = (source: SignalSource, pattern: string, weight: number): SignatureRule => ({
  source,
  pattern,
  weight,
});

// Wappalyzer-inspired signature catalog (simplified for extension runtime).
const CANDIDATES: SignatureCandidate[] = [
  {
    key: 'nextjs',
    name: 'Next.js',
    category: 'framework',
    signatures: [
      sig('globals', '__NEXT_DATA__', 3),
      sig('selectors', '__next_data_script', 3),
      sig('selectors', 'next_root', 2),
      sig('scripts', '/_next/', 2),
      sig('scripts', 'next/static', 2),
      sig('links', '/_next/', 2),
      sig('metas', 'next.js', 2),
      sig('content', '__next_data__', 2),
      sig('content', '__next_f', 2),
      sig('content', 'next-route-announcer', 1),
    ],
  },
  {
    key: 'nuxt',
    name: 'Nuxt',
    category: 'framework',
    signatures: [
      sig('globals', '__NUXT__', 3),
      sig('selectors', '__nuxt_data_script', 3),
      sig('selectors', 'nuxt_head_marker', 2),
      sig('selectors', 'nuxt_root', 2),
      sig('scripts', '/_nuxt/', 2),
      sig('links', '/_nuxt/', 2),
      sig('content', '__nuxt__', 2),
      sig('content', 'nuxtapp', 1),
    ],
  },
  {
    key: 'vue',
    name: 'Vue',
    category: 'framework',
    versionKeys: ['vue'],
    signatures: [
      sig('globals', 'vue', 3),
      sig('globals', '__vue_devtools_global_hook__', 3),
      sig('selectors', 'vue_app_marker', 2),
      sig('selectors', 'vue_sfc_marker', 2),
      sig('scripts', 'vue.runtime', 1),
      sig('scripts', 'vue.global', 1),
      sig('scripts', '/vue', 1),
      sig('links', '/vue', 1),
      sig('content', 'createapp(', 2),
      sig('content', 'new vue(', 2),
    ],
  },
  {
    key: 'react',
    name: 'React',
    category: 'framework',
    versionKeys: ['react'],
    signatures: [
      sig('globals', 'react', 3),
      sig('globals', '__react_devtools_global_hook__', 3),
      sig('selectors', 'react_dom_marker', 2),
      sig('selectors', 'react_root', 1),
      sig('scripts', 'react-dom', 1),
      sig('scripts', '/react', 1),
      sig('links', '/react', 1),
      sig('content', 'reactdom.createroot', 2),
      sig('content', 'reactdom.hydrate', 2),
      sig('content', 'createroot(', 1),
    ],
  },
  {
    key: 'angular',
    name: 'Angular',
    category: 'framework',
    versionKeys: ['angular'],
    signatures: [
      sig('globals', 'angular', 3),
      sig('globals', 'ng', 2),
      sig('selectors', 'ng_version_marker', 3),
      sig('htmlAttrs', 'ng-version', 1),
      sig('scripts', '@angular', 1),
      sig('scripts', 'zone.js', 1),
      sig('scripts', '/angular', 1),
      sig('links', '/angular', 1),
      sig('content', 'angular.module(', 2),
      sig('content', 'platformbrowserdynamic', 2),
      sig('content', 'routermodule.forroot', 1),
    ],
  },
  {
    key: 'jquery',
    name: 'jQuery',
    category: 'framework',
    versionKeys: ['jquery'],
    signatures: [
      sig('globals', 'jquery', 3),
      sig('scripts', 'jquery', 2),
      sig('links', 'jquery', 1),
      sig('content', 'jquery.fn.jquery', 1),
      sig('content', 'jquery(', 1),
    ],
  },
  {
    key: 'svelte',
    name: 'Svelte',
    category: 'framework',
    signatures: [
      sig('selectors', 'svelte_dom_marker', 2),
      sig('scripts', 'svelte', 1),
      sig('links', 'svelte', 1),
      sig('content', 'sveltekit', 1),
      sig('content', '$$props', 1),
    ],
  },
  {
    key: 'preact',
    name: 'Preact',
    category: 'framework',
    signatures: [
      sig('globals', 'preact', 3),
      sig('scripts', 'preact', 1),
      sig('links', 'preact', 1),
      sig('content', 'preact', 1),
      sig('content', '__preactattr_', 2),
    ],
  },
  {
    key: 'solidjs',
    name: 'SolidJS',
    category: 'framework',
    signatures: [
      sig('globals', 'solidjs', 2),
      sig('scripts', 'solid-js', 1),
      sig('links', 'solid-js', 1),
      sig('content', 'createsignal(', 1),
      sig('content', 'creatememo(', 1),
    ],
  },
  {
    key: 'astro',
    name: 'Astro',
    category: 'framework',
    signatures: [
      sig('scripts', '/_astro/', 2),
      sig('links', '/_astro/', 2),
      sig('content', 'astro-island', 3),
      sig('content', 'data-astro-', 2),
      sig('metas', 'astro', 1),
    ],
  },
  {
    key: 'gatsby',
    name: 'Gatsby',
    category: 'framework',
    signatures: [
      sig('globals', '___gatsby', 3),
      sig('content', '___gatsby', 2),
      sig('content', 'gatsby-script', 2),
      sig('scripts', 'gatsby', 1),
      sig('links', 'gatsby', 1),
    ],
  },
  {
    key: 'remix',
    name: 'Remix',
    category: 'framework',
    signatures: [
      sig('globals', '__remixcontext', 3),
      sig('content', 'window.__remixcontext', 3),
      sig('content', 'remix:manifest', 2),
      sig('scripts', 'remix', 1),
      sig('links', 'remix', 1),
    ],
  },
  {
    key: 'alpinejs',
    name: 'Alpine.js',
    category: 'framework',
    signatures: [
      sig('globals', 'alpine', 3),
      sig('htmlAttrs', 'x-data', 2),
      sig('htmlAttrs', 'x-bind', 1),
      sig('content', 'x-data', 2),
      sig('scripts', 'alpine', 1),
    ],
  },
  {
    key: 'stimulus',
    name: 'Stimulus',
    category: 'framework',
    signatures: [
      sig('globals', 'stimulus', 2),
      sig('htmlAttrs', 'data-controller', 2),
      sig('htmlAttrs', 'data-action', 1),
      sig('content', 'data-controller', 1),
      sig('scripts', 'stimulus', 1),
    ],
  },
  {
    key: 'ember',
    name: 'Ember',
    category: 'framework',
    signatures: [
      sig('globals', 'ember', 3),
      sig('scripts', 'ember', 1),
      sig('content', 'ember.application', 1),
    ],
  },
  {
    key: 'backbone',
    name: 'Backbone',
    category: 'framework',
    signatures: [
      sig('globals', 'backbone', 3),
      sig('scripts', 'backbone', 1),
      sig('content', 'backbone.model', 1),
    ],
  },
  {
    key: 'vite',
    name: 'Vite',
    category: 'bundler',
    signatures: [
      sig('scripts', '@vite/client', 3),
      sig('scripts', '/@react-refresh', 3),
      sig('scriptTypes', 'module', 1),
      sig('globals', '__vite_plugin_react_preamble_installed__', 2),
      sig('content', 'import.meta.hot', 2),
    ],
  },
  {
    key: 'webpack',
    name: 'Webpack',
    category: 'bundler',
    signatures: [
      sig('globals', '__webpack_require__', 3),
      sig('globals', 'webpackjsonp', 2),
      sig('globals', '__webpack_chunk_load__', 2),
      sig('scripts', 'webpack', 1),
      sig('scripts', '/static/js/', 1),
      sig('content', '__webpack_require__', 2),
      sig('content', 'webpackchunk', 1),
    ],
  },
  {
    key: 'axios',
    name: 'axios',
    category: 'library',
    versionKeys: ['axios'],
    signatures: [
      sig('globals', 'axios', 3),
      sig('scripts', 'axios', 1),
      sig('links', 'axios', 1),
      sig('content', 'axios.create(', 1),
      sig('content', 'axios.defaults', 1),
    ],
  },
  {
    key: 'redux',
    name: 'redux',
    category: 'library',
    signatures: [
      sig('globals', 'redux', 3),
      sig('globals', '__redux_devtools_extension__', 3),
      sig('globals', '__redux_devtools_extension_compose__', 3),
      sig('scripts', 'redux', 1),
      sig('links', 'redux', 1),
      sig('content', 'configurestore(', 1),
      sig('content', 'createstore(', 1),
    ],
  },
  {
    key: 'vue-router',
    name: 'vue-router',
    category: 'library',
    signatures: [
      sig('globals', 'vuerouter', 3),
      sig('scripts', 'vue-router', 1),
      sig('links', 'vue-router', 1),
      sig('content', 'createwebhistory(', 1),
      sig('content', 'createwebhashhistory(', 1),
    ],
  },
  {
    key: 'react-router',
    name: 'react-router',
    category: 'library',
    signatures: [
      sig('scripts', 'react-router', 1),
      sig('scripts', 'react-router-dom', 1),
      sig('links', 'react-router', 1),
      sig('content', 'browserrouter', 1),
      sig('content', 'hashrouter', 1),
      sig('content', 'routerprovider', 1),
    ],
  },
  {
    key: 'angular-router',
    name: 'angular router',
    category: 'library',
    signatures: [
      sig('scripts', '@angular/router', 1),
      sig('links', '@angular/router', 1),
      sig('content', 'provideRouter(', 1),
      sig('content', 'routermodule.forroot', 1),
    ],
  },
  {
    key: 'vuex',
    name: 'vuex',
    category: 'library',
    signatures: [
      sig('globals', 'vuex', 3),
      sig('scripts', 'vuex', 1),
      sig('content', 'mapstate(', 1),
    ],
  },
  {
    key: 'pinia',
    name: 'pinia',
    category: 'library',
    signatures: [
      sig('globals', 'pinia', 3),
      sig('scripts', 'pinia', 1),
      sig('links', 'pinia', 1),
      sig('content', 'createpinia(', 1),
      sig('content', 'definestore(', 1),
    ],
  },
  {
    key: 'mobx',
    name: 'mobx',
    category: 'library',
    signatures: [
      sig('globals', 'mobx', 3),
      sig('scripts', 'mobx', 1),
      sig('links', 'mobx', 1),
      sig('content', 'makeautoobservable(', 1),
    ],
  },
  {
    key: 'zustand',
    name: 'zustand',
    category: 'library',
    signatures: [
      sig('scripts', 'zustand', 1),
      sig('links', 'zustand', 1),
      sig('content', 'create((set', 1),
    ],
  },
  {
    key: 'tanstack-query',
    name: 'TanStack Query',
    category: 'library',
    signatures: [
      sig('globals', '__react_query_state__', 3),
      sig('scripts', 'tanstack', 1),
      sig('links', 'tanstack', 1),
      sig('content', 'queryclientprovider', 1),
      sig('content', 'usequery(', 1),
    ],
  },
  {
    key: 'apollo-client',
    name: 'Apollo Client',
    category: 'library',
    signatures: [
      sig('globals', '__apollo_client__', 3),
      sig('scripts', 'apollo', 1),
      sig('links', 'apollo', 1),
      sig('content', 'inmemorycache(', 1),
      sig('content', 'apolloclient(', 1),
      sig('content', 'apollo-provider', 1),
    ],
  },
  {
    key: 'rxjs',
    name: 'RxJS',
    category: 'library',
    signatures: [
      sig('globals', 'rxjs', 3),
      sig('scripts', 'rxjs', 1),
      sig('links', 'rxjs', 1),
      sig('content', 'behaviorsubject(', 1),
      sig('content', 'subject(', 1),
      sig('content', 'pipe(', 1),
    ],
  },
];

export const detectTechStackFromSignals = (signals: ProbeSignals): TechStackHit[] => {
  const signalPool: Record<SignalSource, string[]> = {
    scripts: normalizeList(signals.scripts),
    links: normalizeList(signals.links),
    scriptTypes: normalizeList(signals.scriptTypes),
    globals: normalizeList(signals.globals),
    selectors: normalizeList(signals.selectors),
    metas: normalizeList(signals.metas),
    htmlAttrs: normalizeList(signals.htmlAttrs),
    content: normalizeList(signals.content),
  };

  const versions: Record<string, string> = Object.entries(signals.versions || {}).reduce(
    (acc, [key, value]) => {
      acc[key.toLowerCase()] = String(value || '').trim();
      return acc;
    },
    {} as Record<string, string>
  );

  const hits: TechStackHit[] = [];

  CANDIDATES.forEach(candidate => {
    let score = 0;
    let strongCount = 0;
    const evidence = new Set<string>();

    candidate.signatures.forEach(rule => {
      const matched = findByPattern(signalPool[rule.source], rule.pattern);
      if (!matched) {
        return;
      }
      score += rule.weight;
      if (rule.weight >= 3) {
        strongCount += 1;
      }
      evidence.add(`${sourceLabel[rule.source]}: ${matched}`);
    });

    (candidate.versionKeys || []).forEach(versionKey => {
      const version = versions[versionKey.toLowerCase()];
      if (!version) {
        return;
      }
      score += 2;
      evidence.add(`version: ${versionKey}@${version}`);
    });

    if (score <= 0) {
      return;
    }

    hits.push({
      key: candidate.key,
      name: candidate.name,
      category: candidate.category,
      score,
      confidence: toConfidence(score, strongCount),
      evidence: Array.from(evidence),
    });
  });

  return hits.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.name.localeCompare(b.name);
  });
};
