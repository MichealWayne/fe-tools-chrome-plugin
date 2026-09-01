import type { ProbeSignals } from './detector';

type PartialProbeSignals = Partial<ProbeSignals>;

const EMPTY_SIGNALS: ProbeSignals = {
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
  versions: {},
};

export function collectIsolatedPageSignals(): PartialProbeSignals {
  const limitList = (values: string[], limit = 1000) => values.filter(Boolean).slice(0, limit);
  const scripts = Array.from(document.scripts)
    .map(item => item.src || '')
    .filter(Boolean);
  const links = Array.from(document.querySelectorAll('link[href]'))
    .map(item => item.getAttribute('href') || '')
    .filter(Boolean);
  const scriptTypes = Array.from(document.querySelectorAll('script[type]'))
    .map(item => item.getAttribute('type') || '')
    .filter(Boolean);

  const resourceEntries =
    typeof performance?.getEntriesByType === 'function'
      ? (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
      : [];
  const resources = resourceEntries.map(entry => entry.name).filter(Boolean);
  resourceEntries.forEach(entry => {
    if (entry.initiatorType === 'script' && entry.name) {
      scripts.push(entry.name);
    }
    if ((entry.initiatorType === 'link' || entry.initiatorType === 'css') && entry.name) {
      links.push(entry.name);
    }
  });

  const inlineScriptText = Array.from(document.querySelectorAll('script:not([src])'))
    .map(item => item.textContent || '')
    .join('\n')
    .slice(0, 120000)
    .toLowerCase();
  const htmlSnippet = document.documentElement.innerHTML.slice(0, 120000).toLowerCase();
  const contentPool = `${inlineScriptText}\n${htmlSnippet}`;
  const contentPatterns = [
    '__next_data__',
    '__next_f',
    'next-route-announcer',
    '__nuxt__',
    'nuxtapp',
    'createapp(',
    'new vue(',
    'reactdom.hydrate',
    'reactdom.createroot',
    'createroot(',
    'angular.module(',
    'platformbrowserdynamic',
    'routermodule.forroot',
    'import.meta.hot',
    '__webpack_require__',
    'webpackjsonp',
    'webpackchunk',
    'axios.create(',
    'axios.defaults',
    'configurestore(',
    'createstore(',
    'redux devtools',
    'createrouter(',
    'createwebhistory(',
    'createwebhashhistory(',
    'browserrouter',
    'hashrouter',
    'routerprovider',
    'providerouter(',
    'createpinia(',
    'definestore(',
    'makeautoobservable(',
    'observable(',
    'sveltekit',
    '$$props',
    '$$slots',
    'solidjs',
    'createsignal(',
    'creatememo(',
    'ember.application',
    'ember-data',
    'backbone.model',
    'backbone.view',
    'jquery.fn.jquery',
    'astro-island',
    'data-astro-',
    'window.__remixcontext',
    'remix:manifest',
    '___gatsby',
    'gatsby-script',
    '__preactattr_',
    'x-data',
    'data-controller',
    'queryclientprovider',
    'usequery(',
    'inmemorycache(',
    'apolloclient(',
    'apollo-provider',
    'behaviorsubject(',
    'subject(',
  ];
  const content = contentPatterns.filter(pattern => contentPool.includes(pattern));

  const metas = Array.from(document.querySelectorAll('meta')).map(meta => {
    const name = meta.getAttribute('name') || '';
    const property = meta.getAttribute('property') || '';
    const value = meta.getAttribute('content') || '';
    return `${name}|${property}|${value}`;
  });

  const selectors: string[] = [];
  const addSelector = (condition: boolean, marker: string) => {
    if (condition) selectors.push(marker);
  };
  addSelector(
    Boolean(document.querySelector('[data-reactroot],[data-reactid]')),
    'react_dom_marker'
  );
  addSelector(Boolean(document.querySelector('#root,[id*="react-root"]')), 'react_root');
  addSelector(Boolean(document.querySelector('[ng-version]')), 'ng_version_marker');
  addSelector(Boolean(document.querySelector('[data-v-app]')), 'vue_app_marker');
  addSelector(
    Boolean(document.querySelector('[data-svelte-h],[sveltekit\\:prefetch]')),
    'svelte_dom_marker'
  );
  addSelector(Boolean(document.getElementById('__NEXT_DATA__')), '__next_data_script');
  addSelector(Boolean(document.getElementById('__next')), 'next_root');
  addSelector(
    Boolean(document.getElementById('__NUXT__') || document.getElementById('__NUXT_DATA__')),
    '__nuxt_data_script'
  );
  addSelector(Boolean(document.getElementById('__nuxt')), 'nuxt_root');
  addSelector(Boolean(document.querySelector('[data-n-head]')), 'nuxt_head_marker');

  const htmlAttrPool = new Set<string>();
  const sampleNodes = Array.from(document.querySelectorAll('*')).slice(0, 1000);
  let hasVueScopeMarker = false;
  sampleNodes.forEach(node => {
    Array.from(node.attributes || []).forEach(attr => {
      htmlAttrPool.add(attr.name);
      if (attr.value) htmlAttrPool.add(`${attr.name}=${attr.value}`);
      if (attr.name.startsWith('data-v-')) hasVueScopeMarker = true;
    });
  });
  addSelector(hasVueScopeMarker, 'vue_sfc_marker');

  return {
    scripts: limitList(Array.from(new Set(scripts))),
    links: limitList(Array.from(new Set(links))),
    scriptTypes: limitList(Array.from(new Set(scriptTypes)), 50),
    selectors,
    metas: limitList(metas, 200),
    htmlAttrs: limitList(Array.from(htmlAttrPool)),
    content,
    resources: limitList(Array.from(new Set(resources))),
  };
}

export function collectMainWorldSignals(): PartialProbeSignals {
  const pageWindow = window as unknown as Record<string, unknown>;
  const globals: string[] = [];
  const runtime: string[] = [];
  const versions: Record<string, string> = {};

  const safeRead = (key: string): unknown => {
    try {
      return pageWindow[key];
    } catch {
      return undefined;
    }
  };
  const asRecord = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
  const readProperty = (value: unknown, key: string): unknown => {
    try {
      return asRecord(value)?.[key];
    } catch {
      return undefined;
    }
  };
  const setVersion = (key: string, value: unknown) => {
    if (typeof value !== 'string' && typeof value !== 'number') return;
    const normalized = String(value).trim().slice(0, 64);
    if (/^[0-9a-z][0-9a-z.+_-]*$/i.test(normalized)) versions[key] = normalized;
  };
  const addGlobal = (key: string) => {
    if (safeRead(key) !== undefined) globals.push(key);
  };

  [
    'Vue',
    'React',
    'angular',
    'jQuery',
    '__NEXT_DATA__',
    '__NUXT__',
    '__webpack_require__',
    'axios',
    'Redux',
    'VueRouter',
    'Vuex',
    'Pinia',
    'mobx',
    'rxjs',
    'preact',
    'SolidJS',
    'Alpine',
    'Stimulus',
    'Ember',
    'Backbone',
    '___gatsby',
    '__remixContext',
    '__APOLLO_CLIENT__',
    '__REACT_QUERY_STATE__',
  ].forEach(addGlobal);

  const reactHook = safeRead('__REACT_DEVTOOLS_GLOBAL_HOOK__');
  const reactRenderers = readProperty(reactHook, 'renderers');
  const legacyReactRenderers = readProperty(reactHook, '_renderers');
  if (
    (typeof readProperty(reactRenderers, 'size') === 'number' &&
      Number(readProperty(reactRenderers, 'size')) > 0) ||
    (asRecord(legacyReactRenderers) && Object.keys(asRecord(legacyReactRenderers) || {}).length > 0)
  ) {
    runtime.push('react-renderer');
  }

  const vueHook = safeRead('__VUE_DEVTOOLS_GLOBAL_HOOK__');
  const vueApps = readProperty(vueHook, 'apps');
  if (Array.isArray(vueApps) && vueApps.length > 0) runtime.push('vue-app');
  if (asRecord(safeRead('__NEXT_DATA__'))) runtime.push('next-runtime');
  if (safeRead('__NUXT__') !== undefined) runtime.push('nuxt-runtime');
  if (safeRead('angular') !== undefined || safeRead('ng') !== undefined)
    runtime.push('angular-runtime');
  if (readProperty(readProperty(safeRead('jQuery'), 'fn'), 'jquery') !== undefined) {
    runtime.push('jquery-runtime');
  }
  if (safeRead('__webpack_require__') !== undefined) runtime.push('webpack-runtime');
  if (safeRead('axios') !== undefined) runtime.push('axios-runtime');

  setVersion('vue', readProperty(safeRead('Vue'), 'version'));
  setVersion('react', readProperty(safeRead('React'), 'version'));
  setVersion(
    'angular',
    readProperty(readProperty(safeRead('angular'), 'version'), 'full') ||
      readProperty(readProperty(safeRead('ng'), 'version'), 'full')
  );
  setVersion('jquery', readProperty(readProperty(safeRead('jQuery'), 'fn'), 'jquery'));
  setVersion('axios', readProperty(safeRead('axios'), 'VERSION'));

  return { globals, runtime, versions };
}

const normalizeStringList = (value: unknown, limit = 1000): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter(item => typeof item === 'string')
        .map(item => item.trim().slice(0, 2000))
        .filter(Boolean)
    )
  ).slice(0, limit);
};

export const mergeProbeSignals = (...parts: PartialProbeSignals[]): ProbeSignals => {
  const result: ProbeSignals = { ...EMPTY_SIGNALS, versions: {} };
  const listKeys: Array<Exclude<keyof ProbeSignals, 'versions'>> = [
    'scripts',
    'links',
    'scriptTypes',
    'globals',
    'selectors',
    'metas',
    'htmlAttrs',
    'content',
    'resources',
    'runtime',
  ];

  listKeys.forEach(key => {
    result[key] = normalizeStringList(parts.flatMap(part => part[key] || []));
  });
  parts.forEach(part => {
    Object.entries(part.versions || {}).forEach(([key, value]) => {
      if (typeof value !== 'string') return;
      const normalized = value.trim().slice(0, 64);
      if (/^[0-9a-z][0-9a-z.+_-]*$/i.test(normalized)) {
        (result.versions as Record<string, string>)[key.toLowerCase()] = normalized;
      }
    });
  });
  return result;
};

const executeProbe = <T extends PartialProbeSignals>(
  tabId: number,
  world: chrome.scripting.ExecutionWorld,
  func: () => T
) =>
  new Promise<T>((resolve, reject) => {
    chrome.scripting.executeScript({ target: { tabId }, world, func }, results => {
      const error = chrome.runtime.lastError;
      const result = results?.[0]?.result as T | undefined;
      if (error || !result) {
        reject(new Error(error?.message || `No ${world.toLowerCase()} probe result`));
        return;
      }
      resolve(result);
    });
  });

export const runPageProbes = async (tabId: number): Promise<ProbeSignals> => {
  const settled = await Promise.allSettled([
    executeProbe(tabId, 'ISOLATED', collectIsolatedPageSignals),
    executeProbe(tabId, 'MAIN', collectMainWorldSignals),
  ]);
  const successful = settled
    .filter(
      (item): item is PromiseFulfilledResult<PartialProbeSignals> => item.status === 'fulfilled'
    )
    .map(item => item.value);

  if (!successful.length) {
    const firstFailure = settled.find(
      (item): item is PromiseRejectedResult => item.status === 'rejected'
    );
    throw firstFailure?.reason instanceof Error
      ? firstFailure.reason
      : new Error('No probe result');
  }
  return mergeProbeSignals(...successful);
};
