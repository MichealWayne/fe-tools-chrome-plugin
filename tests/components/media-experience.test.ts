import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ImageCompressor from '@/components/ImageCompressor/index.vue';
import PageScreenshot from '@/components/PageScreenshot/index.vue';
import TechStackDetection from '@/components/TechStackDetection/index.vue';
import { optimizeImage } from '@/components/ImageCompressor/optimizer';

vi.mock('@/utils', () => ({
  getFileBase64: vi.fn((_file: File, callback: (value: string) => void) =>
    callback('data:original')
  ),
}));
vi.mock('@/components/ImageCompressor/optimizer', async importOriginal => ({
  ...(await importOriginal<typeof import('@/components/ImageCompressor/optimizer')>()),
  optimizeImage: vi.fn(),
}));

describe('media and inspection experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:image'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    Object.assign(chrome, {
      downloads: { download: vi.fn() },
      scripting: { executeScript: vi.fn() },
    });
  });

  it('constrains the screenshot surface to its workspace width', () => {
    const styles = readFileSync(
      resolve(process.cwd(), 'src/components/PageScreenshot/page-screenshot.less'),
      'utf8'
    );
    expect(styles).toMatch(/\.m-screenshot\s*\{[\s\S]*?width:\s*100%/);
    expect(styles).not.toContain('width: 780px');
  });

  it('uses a keyboard-native upload button and reports successful image processing', async () => {
    vi.mocked(optimizeImage).mockResolvedValue({
      blob: new Blob(['abcdef'], { type: 'image/png' }),
      width: 10,
      height: 10,
      originalWidth: 10,
      originalHeight: 10,
      quality: 1,
      targetMet: true,
      keptOriginal: false,
    });
    const wrapper = mount(ImageCompressor);
    const chooser = wrapper.get('input[type="file"]').element as HTMLInputElement;
    const click = vi.spyOn(chooser, 'click');
    expect(wrapper.get('.image-dropzone').element.tagName).toBe('BUTTON');
    await wrapper.get('.image-dropzone').trigger('click');
    expect(click).toHaveBeenCalled();

    const file = new File(['image'], 'image.png', { type: 'image/png' });
    Object.defineProperty(chooser, 'files', { configurable: true, value: [file] });
    await wrapper.get('input[type="file"]').trigger('change');
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toContain('原始');
    expect(wrapper.get('.image-compressor__preview img').exists()).toBe(true);
  });

  it('shows screenshot errors with a retry action and prevents duplicate capture actions', async () => {
    vi.mocked(chrome.tabs.query).mockImplementation(() => undefined);
    const pendingWrapper = mount(PageScreenshot);
    expect(pendingWrapper.get('.m-screenshot').exists()).toBe(true);
    const pendingCapture = pendingWrapper.findAll('.m-screenshot_btn')[0];
    await pendingCapture.trigger('click');
    expect(pendingCapture.attributes('disabled')).toBeDefined();
    pendingWrapper.unmount();

    vi.mocked(chrome.tabs.query).mockImplementation((_query, callback) => callback([]));
    const wrapper = mount(PageScreenshot);
    const capture = wrapper.findAll('.m-screenshot_btn')[0];
    await capture.trigger('click');
    await flushPromises();
    expect(wrapper.get('.tool-state--error').exists()).toBe(true);
    expect(wrapper.get('.tool-state__action').text()).toBe('重试');
  });

  it('announces an empty tech-stack result and supports retryable failures', async () => {
    vi.mocked(chrome.tabs.query).mockImplementation((_query, callback) =>
      callback([{ id: 1 } as chrome.tabs.Tab])
    );
    vi.mocked(chrome.scripting.executeScript).mockImplementation((_options, callback) => {
      callback?.([
        {
          result: {
            scripts: [],
            links: [],
            scriptTypes: [],
            globals: [],
            selectors: [],
            metas: [],
            htmlAttrs: [],
            content: [],
            versions: {},
          },
        } as chrome.scripting.InjectionResult,
      ]);
    });
    const wrapper = mount(TechStackDetection);
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.get('.tool-state--empty').exists()).toBe(true);

    vi.mocked(chrome.tabs.query).mockImplementation((_query, callback) => callback([]));
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.get('.tool-state--error').exists()).toBe(true);
    expect(wrapper.get('.tool-state__action').exists()).toBe(true);
  });
});
