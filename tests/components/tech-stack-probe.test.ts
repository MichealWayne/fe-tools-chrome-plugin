import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  collectIsolatedPageSignals,
  collectMainWorldSignals,
  mergeProbeSignals,
  runPageProbes,
} from '@/components/TechStackDetection/probe';

describe('tech-stack page probes', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'React', { value: undefined, configurable: true });
    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      value: undefined,
      configurable: true,
    });
  });

  it('collects bounded DOM markers and dynamically loaded script resources', () => {
    document.documentElement.innerHTML = `
      <head><meta name="generator" content="Example"><script type="module"></script></head>
      <body><div data-v-app><span data-v-a1b2=""></span></div></body>
    `;
    const performanceSpy = vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
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
});
