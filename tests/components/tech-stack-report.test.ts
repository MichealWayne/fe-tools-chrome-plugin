import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TechStackDetection from '@/components/TechStackDetection/index.vue';
import { detectTechStackFromSignals } from '@/components/TechStackDetection/detector';
import { runPageProbes } from '@/components/TechStackDetection/probe';
import {
  createTechStackReport,
  formatTechStackSummary,
} from '@/components/TechStackDetection/report';
import {
  collectVersionObservations,
  normalizeVersion,
} from '@/components/TechStackDetection/versions';
import { emptySignals } from '../fixtures/tech-stack-signals';
import { langManager } from '@/utils/i18n';

vi.mock('@/components/TechStackDetection/probe', () => ({ runPageProbes: vi.fn() }));

describe('technology versions and reports', () => {
  it('retains runtime and asset observations independently without inflating technology confidence', () => {
    const signals = {
      ...emptySignals(),
      runtime: ['vue-app'],
      versions: { vue: '3.5.20' },
      scripts: [
        'https://user:password@cdn.test/vue@3.4.21/dist/vue.global.js?token=secret#private',
      ],
    };
    const hit = detectTechStackFromSignals(signals).find(item => item.key === 'vue')!;
    expect(hit.versionConflict).toBe(true);
    expect(hit.versions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ version: '3.5.20', source: 'runtime', confidence: 'high' }),
        expect.objectContaining({
          version: '3.4.21',
          source: 'asset',
          confidence: 'low',
          detail: 'https://cdn.test/vue@3.4.21/dist/vue.global.js',
        }),
      ])
    );
    const assetOnly = detectTechStackFromSignals({ ...signals, runtime: [], versions: {} });
    expect(assetOnly).toEqual([]);
  });

  it.each([
    ['https://cdn.test/jquery-3.7.1.min.js', 'jquery', '3.7.1'],
    ['https://cdn.test/ajax/libs/jquery/3.7.1/jquery.min.js', 'jquery', '3.7.1'],
    ['https://cdn.test/@angular/core@20.1.0/fesm2022/core.mjs', 'angular', '20.1.0'],
    ['https://cdn.test/npm/vue@3.5.0-rc.1/dist/vue.js', 'vue', '3.5.0-rc.1'],
  ])('extracts explicit package URL versions: %s', (asset, technology, version) => {
    expect(collectVersionObservations({ ...emptySignals(), scripts: [asset] })).toEqual([
      expect.objectContaining({ technology, version, source: 'asset' }),
    ]);
  });

  it('rejects hashes, build IDs, query versions and unrelated paths', () => {
    ['a1b2c3', 'latest', '20261020', '<script>', '1', '1.2.3/secret'].forEach(value =>
      expect(normalizeVersion(value)).toBeUndefined()
    );
    const signals = {
      ...emptySignals(),
      scripts: [
        'https://react.test/not-react.js?jquery=3.7.1',
        'https://cdn.test/not-jquery@3.7.1/jquery.min.js',
        'https://cdn.test/_next/static/a1b2c3/app.js',
      ],
    };
    expect(collectVersionObservations(signals)).toEqual([]);
    expect(
      detectTechStackFromSignals({
        ...emptySignals(),
        selectors: ['react_root'],
        scripts: ['https://react.test/search?file=/react.js'],
      })
    ).toEqual([]);
  });

  it('redacts target and evidence URLs when copying summary or JSON', () => {
    const report = createTechStackReport({
      target: 'https://name:password@example.test/path?token=secret#private',
      scannedAt: '2026-10-20T00:00:00.000Z',
      scope: 'main-frame',
      coverage: { isolated: 'ok', main: 'failed' },
      hits: [
        {
          key: 'react',
          name: 'React',
          category: 'framework',
          confidence: 'medium',
          score: 3,
          evidence: ['script: https://name:password@cdn.test/react.js?token=secret#private'],
        },
      ],
    });
    expect(report.target).toBe('https://example.test/path');
    expect(report.hits[0].evidence).toEqual(['script: https://cdn.test/react.js']);
    const text = formatTechStackSummary(report);
    expect(text).toContain('version unknown');
    expect(text).toContain('runtime: failed');
    expect(JSON.stringify(report) + text).not.toMatch(/password|secret|private/);
  });
});

describe('technology report UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(chrome.tabs.query).mockImplementation((_options, callback) =>
      callback([{ id: 7, url: 'https://example.test/?token=secret' } as chrome.tabs.Tab])
    );
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('shows versions, sources, conflicts and partial status, and copies redacted JSON', async () => {
    vi.mocked(runPageProbes).mockResolvedValue({
      ...emptySignals(),
      versions: { vue: '3.5.20' },
      scripts: ['https://cdn.test/vue@3.4.21/dist/vue.js?token=secret'],
      coverage: { isolated: 'ok', main: 'failed' },
    });
    const wrapper = mount(TechStackDetection);
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('3.5.20');
    expect(wrapper.text()).toContain('3.4.21');
    expect(wrapper.text()).toContain('资源 URL 声明版本');
    expect(wrapper.text()).toContain('多个版本');
    expect(wrapper.get('[role="status"]').text()).toContain('结果可能不完整');
    expect(wrapper.text()).not.toContain('secret');
    await wrapper.findAll('.copy-button')[1].trigger('click');
    await flushPromises();
    const copied = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
    expect(JSON.parse(copied)).toMatchObject({ scope: 'main-frame', coverage: { main: 'failed' } });
    expect(copied).not.toContain('secret');
    wrapper.unmount();
  });

  it('renders unknown versions in English and clears old results on retry', async () => {
    langManager.setLanguage('en');
    vi.mocked(runPageProbes).mockResolvedValueOnce({
      ...emptySignals(),
      runtime: ['react-renderer'],
      coverage: { isolated: 'ok', main: 'ok' },
    });
    const wrapper = mount(TechStackDetection);
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Version unknown');
    expect(wrapper.text()).toContain('Scanned at:');
    vi.mocked(runPageProbes).mockRejectedValueOnce(new Error('sensitive raw failure'));
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.m-tech-stack__result').exists()).toBe(false);
    expect(wrapper.text()).toContain('Unable to analyze this page');
    expect(wrapper.text()).not.toContain('sensitive');
    wrapper.unmount();
  });
});
