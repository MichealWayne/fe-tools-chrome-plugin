import type { ProbeSignals } from './detector';
import type { VersionObservation } from './types';
import { normalizeVersionObservations } from './versions';
import { collectMainWorldSignals } from './runtime-probe';

export { collectMainWorldSignals } from './runtime-probe';

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
  const contentPool = inlineScriptText;
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

  const metas = Array.from(document.querySelectorAll('meta'))
    .map(meta => {
      const name = meta.getAttribute('name') || '';
      const property = meta.getAttribute('property') || '';
      const value = meta.getAttribute('content') || '';
      return name.toLowerCase() === 'generator' ? `${name}|${property}|${value.slice(0, 160)}` : '';
    })
    .filter(Boolean);

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
  addSelector(Boolean(document.querySelector('astro-island')), 'astro_island');
  addSelector(Boolean(document.querySelector('[_echarts_instance_]')), 'echarts_instance');
  addSelector(Boolean(document.querySelector('.monaco-editor .view-lines')), 'monaco_editor');
  addSelector(
    Boolean(document.querySelector('.CodeMirror .CodeMirror-code,.cm-editor .cm-content')),
    'codemirror_editor'
  );
  addSelector(
    Boolean(document.querySelector('.el-button,.el-input,.el-select')),
    'element_component'
  );
  addSelector(Boolean(document.querySelector('.ant-btn,.ant-input,.ant-select')), 'antd_component');
  addSelector(
    Boolean(document.querySelector('[data-bs-toggle],[data-bs-target]')),
    'bootstrap_component'
  );

  const versionObservations: VersionObservation[] = Array.from(
    document.querySelectorAll('[ng-version]')
  )
    .slice(0, 30)
    .map(node => ({
      technology: 'angular',
      version: node.getAttribute('ng-version') || '',
      source: 'dom',
      detail: 'ng-version',
      confidence: 'high',
    }));
  document.querySelectorAll('meta[name="generator"]').forEach(meta => {
    const match = (meta.getAttribute('content') || '')
      .slice(0, 160)
      .match(/^(Astro|Next\.js|Nuxt(?:\.js)?)\s+v?(\d+\.\d+(?:\.\d+)?(?:-[0-9a-z.-]+)?)$/i);
    if (match)
      versionObservations.push({
        technology: /^astro$/i.test(match[1])
          ? 'astro'
          : /^next/i.test(match[1])
            ? 'nextjs'
            : 'nuxt',
        version: match[2],
        source: 'dom',
        detail: 'meta generator',
        confidence: 'high',
      });
  });

  const htmlAttrPool = new Set<string>();
  const sampleNodes = Array.from(document.querySelectorAll('*')).slice(0, 1000);
  let hasVueScopeMarker = false;
  sampleNodes.forEach(node => {
    Array.from(node.attributes || []).forEach(attr => {
      htmlAttrPool.add(attr.name);
      if (attr.name === 'ng-version') htmlAttrPool.add(`${attr.name}=${attr.value.slice(0, 64)}`);
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
    versionObservations,
  };
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
  const listKeys: Array<
    Exclude<keyof ProbeSignals, 'versions' | 'versionObservations' | 'coverage'>
  > = [
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
  result.versionObservations = normalizeVersionObservations(
    parts.flatMap(part => part.versionObservations || [])
  );
  return result;
};

const executeProbe = <T extends PartialProbeSignals>(
  tabId: number,
  world: chrome.scripting.ExecutionWorld,
  func: () => T
) =>
  new Promise<{ signals: T; documentId?: string }>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Probe timed out')), 4000);
    chrome.scripting.executeScript({ target: { tabId }, world, func }, results => {
      clearTimeout(timer);
      const error = chrome.runtime.lastError;
      const result = results?.[0]?.result as T | undefined;
      if (error || !result) {
        reject(new Error(error?.message || `No ${world.toLowerCase()} probe result`));
        return;
      }
      resolve({ signals: result, documentId: results?.[0]?.documentId });
    });
  });

export const runPageProbes = async (tabId: number): Promise<ProbeSignals> => {
  const settled = await Promise.allSettled([
    executeProbe(tabId, 'ISOLATED', collectIsolatedPageSignals),
    executeProbe(tabId, 'MAIN', collectMainWorldSignals),
  ]);
  const successful = settled
    .filter(
      (
        item
      ): item is PromiseFulfilledResult<{ signals: PartialProbeSignals; documentId?: string }> =>
        item.status === 'fulfilled'
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
  const documents = new Set(successful.map(item => item.documentId).filter(Boolean));
  if (documents.size > 1) throw new Error('Page changed during detection');
  return {
    ...mergeProbeSignals(...successful.map(item => item.signals)),
    coverage: {
      isolated: settled[0].status === 'fulfilled' ? 'ok' : 'failed',
      main: settled[1].status === 'fulfilled' ? 'ok' : 'failed',
    },
  };
};
