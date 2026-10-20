import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { detectTechStackFromSignals } from '@/components/TechStackDetection/detector';
import { createApp, h, version as vueVersion } from 'vue';
import axios from 'axios';
import {
  collectIsolatedPageSignals,
  collectMainWorldSignals,
  mergeProbeSignals,
  runPageProbes,
} from '@/components/TechStackDetection/probe';

describe('tech-stack page probes', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'React', { value: undefined, configurable: true });
    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      value: undefined,
      configurable: true,
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('reads callable jQuery, Axios and Vue 2 exports through to detection', () => {
    vi.stubGlobal(
      'jQuery',
      Object.assign(function jquery() {}, { fn: { jquery: '3.7.1' } })
    );
    vi.stubGlobal(
      'axios',
      Object.assign(function axios() {}, { VERSION: '1.8.2', request() {} })
    );
    vi.stubGlobal(
      'Vue',
      Object.assign(function Vue() {}, { version: '2.7.16' })
    );
    const hits = detectTechStackFromSignals(mergeProbeSignals(collectMainWorldSignals()));
    [
      ['jquery', '3.7.1'],
      ['axios', '1.8.2'],
      ['vue', '2.7.16'],
    ].forEach(([key, version]) => {
      expect(hits.find(hit => hit.key === key)?.versions).toEqual(
        expect.arrayContaining([expect.objectContaining({ version, source: 'runtime' })])
      );
    });
  });

  it('detects the installed Vue app and callable Axios library with their actual versions', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const app = createApp({ render: () => h('p', 'runtime fixture') });
    app.mount(host);
    vi.stubGlobal('axios', axios);
    try {
      const hits = detectTechStackFromSignals(mergeProbeSignals(collectMainWorldSignals()));
      expect(hits.find(hit => hit.key === 'vue')?.versions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ version: vueVersion, detail: 'mounted Vue app' }),
        ])
      );
      expect(hits.find(hit => hit.key === 'axios')?.versions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ version: axios.VERSION, detail: 'axios.VERSION' }),
        ])
      );
    } finally {
      app.unmount();
    }
  });

  it('extracts mounted Vue and registered renderer versions without global exports', () => {
    document.body.innerHTML = '<div id="app"></div>';
    Object.assign(document.getElementById('app')!, {
      __vue_app__: { version: '3.5.20', mount() {} },
    });
    vi.stubGlobal('__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      renderers: new Map([
        [1, { version: '18.3.1' }],
        [2, { version: '19.1.1' }],
      ]),
    });
    const hits = detectTechStackFromSignals(mergeProbeSignals(collectMainWorldSignals()));
    expect(hits.find(hit => hit.key === 'vue')?.versions?.[0].version).toBe('3.5.20');
    expect(hits.find(hit => hit.key === 'react')).toMatchObject({ versionConflict: true });
    expect(hits.find(hit => hit.key === 'react')?.versions?.map(item => item.version)).toEqual([
      '18.3.1',
      '19.1.1',
    ]);
  });

  it('distinguishes AngularJS runtime versions from Angular DOM versions', () => {
    vi.stubGlobal('angular', { version: { full: '1.8.3' }, module() {} });
    const legacy = detectTechStackFromSignals(mergeProbeSignals(collectMainWorldSignals()));
    expect(legacy.map(hit => hit.key)).toContain('angularjs');
    expect(legacy.map(hit => hit.key)).not.toContain('angular');
    document.body.innerHTML = '<app-root ng-version="20.1.0"></app-root>';
    const modern = detectTechStackFromSignals(mergeProbeSignals(collectIsolatedPageSignals()));
    expect(modern.find(hit => hit.key === 'angular')?.versions?.[0]).toMatchObject({
      version: '20.1.0',
      source: 'dom',
    });
  });

  it('does not treat documentation prose as inline script evidence', () => {
    document.body.innerHTML = '<pre>createApp( axios.create( __webpack_require__</pre>';
    expect(collectIsolatedPageSignals().content).toEqual([]);
  });

  it('tolerates throwing runtime getters and ignores empty name placeholders', () => {
    vi.stubGlobal('axios', 'placeholder');
    vi.stubGlobal(
      'Vue',
      Object.defineProperty({}, 'version', {
        get() {
          throw new Error('page getter');
        },
      })
    );
    expect(collectMainWorldSignals().globals).not.toContain('axios');
    expect(collectMainWorldSignals().versions).toEqual({});
  });

  it.each([
    ['ElementPlus', { version: '2.11.0', install() {} }, 'element-plus'],
    ['antd', { version: '5.27.0', Button: {} }, 'antd'],
    ['echarts', { version: '6.0.0', init() {} }, 'echarts'],
    ['Chart', Object.assign(function Chart() {}, { version: '4.5.0', register() {} }), 'chartjs'],
    [
      'CodeMirror',
      Object.assign(function CodeMirror() {}, { version: '5.65.19', fromTextArea() {} }),
      'codemirror',
    ],
    [
      'bootstrap',
      { Modal: Object.assign(function Modal() {}, { VERSION: '5.3.8', getInstance() {} }) },
      'bootstrap',
    ],
    ['monaco', { editor: { create() {} } }, 'monaco'],
  ])('detects validated %s runtime exports', (name, value, key) => {
    vi.stubGlobal(name, value);
    const hits = detectTechStackFromSignals(mergeProbeSignals(collectMainWorldSignals()));
    expect(hits.map(hit => hit.key)).toContain(key);
    if (key !== 'monaco')
      expect(hits.find(hit => hit.key === key)?.versions?.length).toBeGreaterThan(0);
  });

  it('reads explicit generator versions without collecting unrelated meta or attribute values', () => {
    document.head.innerHTML =
      '<meta name="generator" content="Astro v5.13.0"><meta name="token" content="secret">';
    document.body.innerHTML = '<div x-data="{token: \'secret\'}"></div>';
    const signals = collectIsolatedPageSignals();
    expect(JSON.stringify(signals)).not.toContain('secret');
    expect(
      detectTechStackFromSignals(mergeProbeSignals(signals)).find(hit => hit.key === 'astro')
        ?.versions?.[0]
    ).toMatchObject({ version: '5.13.0', source: 'dom' });
    document.head.innerHTML = '';
  });

  it('collects bounded DOM markers and dynamically loaded script resources', () => {
    document.documentElement.innerHTML = `
      <head><meta name="generator" content="Example"><script type="module"></script></head>
      <body><div data-v-app><span data-v-a1b2=""></span></div></body>
    `;
    const performanceSpy = vi
      .spyOn(performance, 'getEntriesByType')
      .mockReturnValue([
        { name: 'https://example.com/assets/app.js', initiatorType: 'script' },
      ] as PerformanceEntry[]);

    const signals = collectIsolatedPageSignals();

    expect(signals.selectors).toEqual(expect.arrayContaining(['vue_app_marker', 'vue_sfc_marker']));
    expect(signals.scripts).toContain('https://example.com/assets/app.js');
    expect(signals.scriptTypes).toContain('module');
    performanceSpy.mockRestore();
  });

  it('requires a registered renderer rather than an empty React DevTools hook', () => {
    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      value: { renderers: new Map() },
      configurable: true,
    });
    expect(collectMainWorldSignals().runtime).not.toContain('react-renderer');
    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      value: { renderers: new Map([[1, {}]]) },
      configurable: true,
    });
    expect(collectMainWorldSignals().runtime).toContain('react-renderer');
  });

  it('normalizes, bounds, and merges partial probe results', () => {
    const merged = mergeProbeSignals(
      { scripts: [' app.js ', 'app.js'], selectors: ['react_root'] },
      {
        runtime: ['react-renderer', 42 as unknown as string],
        versions: { React: '19.1.1', invalid: '<script>' },
      }
    );
    expect(merged.scripts).toEqual(['app.js']);
    expect(merged.runtime).toEqual(['react-renderer']);
    expect(merged.versions).toEqual({ react: '19.1.1' });
  });

  it('executes isolated and main-world probes and merges their results', async () => {
    const executeScript = vi.fn((injection, callback) =>
      callback([
        {
          result:
            injection.world === 'MAIN'
              ? { runtime: ['react-renderer'] }
              : { selectors: ['react_dom_marker'] },
        },
      ])
    );
    Object.assign(chrome, { scripting: { executeScript } });
    const result = await runPageProbes(7);
    expect(executeScript).toHaveBeenCalledTimes(2);
    expect(executeScript.mock.calls.map(call => call[0].world)).toEqual(['ISOLATED', 'MAIN']);
    expect(result.runtime).toEqual(['react-renderer']);
    expect(result.selectors).toEqual(['react_dom_marker']);
  });

  it('uses the successful probe when the other world is unavailable', async () => {
    const executeScript = vi.fn((injection, callback) => {
      if (injection.world === 'MAIN') return callback([]);
      callback([{ result: { selectors: ['vue_app_marker'] } }]);
    });
    Object.assign(chrome, { scripting: { executeScript } });
    await expect(runPageProbes(9)).resolves.toMatchObject({ selectors: ['vue_app_marker'] });
  });

  it('bounds a missing callback and reports incomplete collection', async () => {
    vi.useFakeTimers();
    Object.assign(chrome, {
      scripting: {
        executeScript: vi.fn((injection, callback) => {
          if (injection.world === 'ISOLATED')
            callback([{ result: { selectors: ['vue_app_marker'] } }]);
        }),
      },
    });
    const promise = runPageProbes(9);
    await vi.advanceTimersByTimeAsync(4000);
    await expect(promise).resolves.toMatchObject({ coverage: { isolated: 'ok', main: 'failed' } });
  });

  it('rejects signals from different documents and total probe failures', async () => {
    Object.assign(chrome, {
      scripting: {
        executeScript: vi.fn((injection, callback) =>
          callback([{ result: {}, documentId: injection.world }])
        ),
      },
    });
    await expect(runPageProbes(9)).rejects.toThrow('Page changed');
    vi.mocked(chrome.scripting.executeScript).mockImplementation((_injection, callback) =>
      callback?.([])
    );
    await expect(runPageProbes(9)).rejects.toThrow();
  });
});
