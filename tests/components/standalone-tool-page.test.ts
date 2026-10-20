import { readFileSync } from 'node:fs';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StandaloneToolPage from '@/components/Experience/StandaloneToolPage.vue';
import QRCode from '@/components/QRCode/index.vue';
import TechStackDetection from '@/components/TechStackDetection/index.vue';
import { handleQRCode } from '@/utils';
import { getLocalTabUrl } from '@/utils/chrome';
import { runPageProbes } from '@/components/TechStackDetection/probe';

vi.mock('@/utils', () => ({ handleQRCode: vi.fn() }));
vi.mock('@/utils/chrome', () => ({ getLocalTabUrl: vi.fn() }));
vi.mock('@/components/TechStackDetection/probe', () => ({ runPageProbes: vi.fn() }));

const sourceUrl = 'https://example.test/path?name=中文&x=1#fragment';
const svg = 'data:image/svg+xml;base64,preview';
const downloadQR = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  window.location.search = '';
  Object.assign(chrome.tabs, {
    get: vi.fn().mockResolvedValue({ id: 12, url: sourceUrl }),
  });
  vi.mocked(handleQRCode).mockReturnValue({ getImgUrl: () => svg, downloadQR } as never);
  vi.mocked(runPageProbes).mockResolvedValue({
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
  });
});
afterEach(() => {
  window.location.search = '';
});

describe('standalone tool pages', () => {
  it('generates the originating URL QR and preserves editing and download controls', async () => {
    window.location.search = `?type=qrcode&url=${encodeURIComponent(sourceUrl)}`;
    const wrapper = mount(StandaloneToolPage, { props: { tool: 'qrcode' } });
    await flushPromises();
    expect(wrapper.get('input').element).toHaveProperty('value', sourceUrl);
    expect(handleQRCode).toHaveBeenCalledWith(sourceUrl);
    expect(getLocalTabUrl).not.toHaveBeenCalled();
    expect(wrapper.get('img').attributes('src')).toBe(svg);
    await wrapper.get('input').setValue('https://other.test');
    await wrapper.get('input').trigger('keydown.enter');
    expect(handleQRCode).toHaveBeenLastCalledWith('https://other.test');
    await wrapper.get('.qr-tool__download').trigger('click');
    expect(downloadQR).toHaveBeenCalledWith('svg');
    wrapper.unmount();
  });

  it('shows an error for missing QR input instead of encoding the extension page', async () => {
    const wrapper = mount(StandaloneToolPage, { props: { tool: 'qrcode' } });
    await flushPromises();
    expect(wrapper.get('.tool-state--error').exists()).toBe(true);
    expect(getLocalTabUrl).not.toHaveBeenCalled();
    expect(handleQRCode).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('automatically detects the originating tab and updates target metadata on retry', async () => {
    window.location.search = '?type=tech-stack&sourceTabId=12&url=https%3A%2F%2Fold.test';
    const wrapper = mount(StandaloneToolPage, { props: { tool: 'tech-stack' } });
    await flushPromises();
    expect(chrome.tabs.get).toHaveBeenCalledWith(12);
    expect(runPageProbes).toHaveBeenCalledWith(12);
    expect(chrome.tabs.query).not.toHaveBeenCalled();
    expect(wrapper.get('.m-tech-stack__target').text()).toContain('https://example.test/path');
    vi.mocked(chrome.tabs.get).mockResolvedValueOnce({
      id: 12,
      url: 'https://new.test',
    } as chrome.tabs.Tab);
    await wrapper.get('.m-tech-stack__actions button').trigger('click');
    await flushPromises();
    expect(wrapper.get('.m-tech-stack__target').text()).toContain('https://new.test');
    wrapper.unmount();
  });

  it('reports a closed source tab without probing the active extension page', async () => {
    window.location.search = '?type=tech-stack&sourceTabId=12';
    vi.mocked(chrome.tabs.get).mockRejectedValue(new Error('No tab'));
    const wrapper = mount(StandaloneToolPage, { props: { tool: 'tech-stack' } });
    await flushPromises();
    expect(wrapper.get('.tool-state--error').text()).toContain('当前页面无法分析');
    expect(runPageProbes).not.toHaveBeenCalled();
    expect(chrome.tabs.query).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('keeps normal popup detection manual and tied to the active tab', async () => {
    vi.mocked(chrome.tabs.query)
      .mockClear()
      .mockImplementation((_query, callback) => {
        callback([{ id: 77 } as chrome.tabs.Tab]);
      });
    const wrapper = mount(TechStackDetection);
    await flushPromises();
    expect(runPageProbes).not.toHaveBeenCalled();
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(runPageProbes).toHaveBeenCalledWith(77);
    expect(chrome.tabs.get).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('keeps desktop wrapper styles outside the embedded QR component', async () => {
    const wrapper = mount(QRCode, { props: { keywords: sourceUrl } });
    await flushPromises();
    expect(wrapper.find('.standalone-tool-page').exists()).toBe(false);
    const styles = readFileSync('src/components/Experience/StandaloneToolPage.vue', 'utf8');
    expect(styles).toContain('<style scoped>');
    expect(styles).toContain('margin: 40px auto');
    expect(styles).not.toMatch(/(?:body|#app|\.m-ctn)\s*\{/);
    wrapper.unmount();
  });
});
