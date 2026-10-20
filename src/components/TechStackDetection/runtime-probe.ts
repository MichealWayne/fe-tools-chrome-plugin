import type { ProbeSignals, VersionObservation } from './types';

type PartialProbeSignals = Partial<ProbeSignals>;

export function collectMainWorldSignals(): PartialProbeSignals {
  const pageWindow = window as unknown as Record<string, unknown>;
  const globals: string[] = [];
  const runtime: string[] = [];
  const versions: Record<string, string> = {};
  const versionObservations: VersionObservation[] = [];

  const safeRead = (key: string): unknown => {
    try {
      return pageWindow[key];
    } catch {
      return undefined;
    }
  };
  const asRecord = (value: unknown): Record<string, unknown> | undefined =>
    value && (typeof value === 'object' || typeof value === 'function')
      ? (value as Record<string, unknown>)
      : undefined;
  const readProperty = (value: unknown, key: string): unknown => {
    try {
      return asRecord(value)?.[key];
    } catch {
      return undefined;
    }
  };
  const setVersion = (
    key: string,
    value: unknown,
    detail = 'public version field',
    source: VersionObservation['source'] = 'runtime'
  ) => {
    if (typeof value !== 'string' || value.length > 64) return;
    const normalized = value.trim();
    if (
      !/^\d{1,4}\.\d{1,4}(?:\.\d{1,4})?(?:-[0-9a-z][0-9a-z.-]*)?(?:\+[0-9a-z][0-9a-z.-]*)?$/i.test(
        normalized
      )
    )
      return;
    versions[key] = normalized;
    if (
      versionObservations.some(
        item =>
          item.technology === key &&
          item.version === normalized &&
          item.detail === detail &&
          item.source === source
      )
    )
      return;
    versionObservations.push({
      technology: key,
      version: normalized,
      source,
      detail,
      confidence: source === 'devtools' ? 'medium' : 'high',
    });
  };
  const addGlobal = (key: string) => {
    if (asRecord(safeRead(key))) globals.push(key);
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

  const hasMethod = (value: unknown, key: string) => typeof readProperty(value, key) === 'function';
  // Names alone are not decisive: validate the public API shape of common exports.
  const shapes: Array<[string, string]> = [
    ['Vue', 'version'],
    ['React', 'createElement'],
    ['angular', 'module'],
    ['jQuery', 'fn'],
    ['axios', 'request'],
  ];
  shapes.forEach(([key, property]) => {
    if (readProperty(safeRead(key), property) === undefined) {
      const index = globals.indexOf(key);
      if (index >= 0) globals.splice(index, 1);
    }
  });

  const reactHook = safeRead('__REACT_DEVTOOLS_GLOBAL_HOOK__');
  const reactRenderers = readProperty(reactHook, 'renderers');
  const legacyReactRenderers = readProperty(reactHook, '_renderers');
  if (
    (typeof readProperty(reactRenderers, 'size') === 'number' &&
      Number(readProperty(reactRenderers, 'size')) > 0) ||
    (asRecord(legacyReactRenderers) && Object.keys(asRecord(legacyReactRenderers) || {}).length > 0)
  ) {
    runtime.push('react-renderer');
    // Read the native Map with the built-in method, never a page-provided iterator.
    try {
      Array.from(Map.prototype.values.call(reactRenderers) as Iterable<unknown>)
        .slice(0, 20)
        .forEach(renderer =>
          setVersion(
            'react',
            readProperty(renderer, 'version'),
            'registered React renderer',
            'devtools'
          )
        );
    } catch {
      if (asRecord(legacyReactRenderers))
        Object.values(asRecord(legacyReactRenderers) || {})
          .slice(0, 20)
          .forEach(renderer =>
            setVersion(
              'react',
              readProperty(renderer, 'version'),
              'registered React renderer',
              'devtools'
            )
          );
    }
  }

  const vueHook = safeRead('__VUE_DEVTOOLS_GLOBAL_HOOK__');
  const vueApps = readProperty(vueHook, 'apps');
  if (Array.isArray(vueApps) && vueApps.length > 0) {
    runtime.push('vue-app');
    vueApps
      .slice(0, 20)
      .forEach(entry =>
        setVersion(
          'vue',
          readProperty(readProperty(entry, 'app') || entry, 'version'),
          'registered Vue app',
          'devtools'
        )
      );
  }
  Array.from(document.querySelectorAll('*'))
    .slice(0, 1000)
    .forEach(node => {
      const app = readProperty(node, '__vue_app__');
      if (hasMethod(app, 'mount') && typeof readProperty(app, 'version') === 'string') {
        runtime.push('vue-app');
        setVersion('vue', readProperty(app, 'version'), 'mounted Vue app');
      }
      const instance = readProperty(node, '__vue__');
      const constructor = readProperty(instance, 'constructor');
      if (
        readProperty(instance, '$el') === node &&
        typeof readProperty(constructor, 'version') === 'string'
      ) {
        runtime.push('vue-app');
        setVersion('vue', readProperty(constructor, 'version'), 'mounted Vue 2 instance');
      }
      if (
        Object.keys(node).some(
          key => key.startsWith('__reactFiber$') || key.startsWith('__reactContainer$')
        )
      ) {
        runtime.push('react-renderer');
      }
    });
  if (asRecord(safeRead('__NEXT_DATA__'))) runtime.push('next-runtime');
  if (safeRead('__NUXT__') !== undefined) runtime.push('nuxt-runtime');
  if (hasMethod(safeRead('angular'), 'module')) runtime.push('angularjs-runtime');
  if (hasMethod(safeRead('ng'), 'getComponent')) runtime.push('angular-runtime');
  if (readProperty(readProperty(safeRead('jQuery'), 'fn'), 'jquery') !== undefined) {
    runtime.push('jquery-runtime');
  }
  if (safeRead('__webpack_require__') !== undefined) runtime.push('webpack-runtime');
  if (hasMethod(safeRead('axios'), 'request')) runtime.push('axios-runtime');

  const libraries: Array<[string, string, string, string]> = [
    ['ElementPlus', 'element-plus', 'install', 'version'],
    ['antd', 'antd', 'Button', 'version'],
    ['echarts', 'echarts', 'init', 'version'],
    ['Chart', 'chartjs', 'register', 'version'],
    ['CodeMirror', 'codemirror', 'fromTextArea', 'version'],
  ];
  libraries.forEach(([global, technology, method, versionField]) => {
    const library = safeRead(global);
    if (!hasMethod(library, method) && !asRecord(readProperty(library, method))) return;
    runtime.push(`${technology}-runtime`);
    setVersion(technology, readProperty(library, versionField), `${global}.${versionField}`);
  });
  const bootstrap = safeRead('bootstrap');
  const modal = readProperty(bootstrap, 'Modal');
  if (typeof modal === 'function' && hasMethod(modal, 'getInstance')) {
    runtime.push('bootstrap-runtime');
    setVersion('bootstrap', readProperty(modal, 'VERSION'), 'bootstrap.Modal.VERSION');
  }
  if (hasMethod(readProperty(safeRead('monaco'), 'editor'), 'create'))
    runtime.push('monaco-runtime');

  setVersion('vue', readProperty(safeRead('Vue'), 'version'), 'Vue.version');
  setVersion('react', readProperty(safeRead('React'), 'version'), 'React.version');
  setVersion(
    'angularjs',
    hasMethod(safeRead('angular'), 'module')
      ? readProperty(readProperty(safeRead('angular'), 'version'), 'full')
      : undefined,
    'angular.version.full'
  );
  setVersion(
    'jquery',
    readProperty(readProperty(safeRead('jQuery'), 'fn'), 'jquery'),
    'jQuery.fn.jquery'
  );
  setVersion('axios', readProperty(safeRead('axios'), 'VERSION'), 'axios.VERSION');

  return { globals, runtime: Array.from(new Set(runtime)), versions, versionObservations };
}
