import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import ImageCompressor from '@/components/ImageCompressor/index.vue';
import {
  blobToDataUrl,
  ImageOptimizationError,
  optimizeImage,
  type OptimizedImage,
} from '@/components/ImageCompressor/optimizer';
import { langManager } from '@/utils/i18n';

vi.mock('@/components/ImageCompressor/optimizer', async importOriginal => ({
  ...(await importOriginal<typeof import('@/components/ImageCompressor/optimizer')>()),
  optimizeImage: vi.fn(),
  blobToDataUrl: vi.fn(),
}));

const output = (overrides: Partial<OptimizedImage> = {}): OptimizedImage => ({
  blob: new Blob(['abc'], { type: 'image/webp' }),
  width: 1600,
  height: 1200,
  originalWidth: 4000,
  originalHeight: 3000,
  quality: 0.8,
  targetMet: true,
  keptOriginal: false,
  ...overrides,
});

describe('image optimization workflows', () => {
  let wrapper: VueWrapper;
  let urls = 0;
  const button = (text: string) => wrapper.findAll('button').find(item => item.text() === text)!;
  async function upload(file = new File(['source'], 'my.photo.webp', { type: 'image/webp' })) {
    const input = wrapper.get<HTMLInputElement>('input[type=file]');
    Object.defineProperty(input.element, 'files', { configurable: true, value: [file] });
    await input.trigger('change');
    await flushPromises();
    return file;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    urls = 0;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => `blob:test-${++urls}`),
    });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.mocked(optimizeImage).mockResolvedValue(output());
    vi.mocked(blobToDataUrl).mockResolvedValue('data:image/webp;base64,YWJj');
    wrapper = mount(ImageCompressor);
  });
  afterEach(() => {
    wrapper.unmount();
    vi.restoreAllMocks();
  });

  it('imports with explicit original/result metrics and generates Base64 only on request', async () => {
    await upload();
    expect(optimizeImage).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({
        format: 'image/webp',
        quality: 0.8,
        maxWidth: undefined,
        targetBytes: undefined,
      }),
      expect.any(AbortSignal)
    );
    expect(wrapper.get('.image-compressor__details').text()).toContain('4000 × 3000 → 1600 × 1200');
    expect(wrapper.get('.image-compressor__metrics').text()).toContain('减少 50.0%');
    expect(blobToDataUrl).not.toHaveBeenCalled();
    await button('生成 Base64').trigger('click');
    await flushPromises();
    expect(wrapper.get('textarea').element.value).toBe('data:image/webp;base64,YWJj');
  });

  it('marks settings stale, applies presets/limits/budget and refreshes the actual output', async () => {
    await upload();
    await wrapper.get('#image-quality-preset').setValue('0.6');
    expect(wrapper.get('.image-compressor__stale').text()).toContain('重新压缩');
    expect(button('下载压缩图片').attributes('disabled')).toBeDefined();
    await wrapper.get('[data-test=resize]').setValue(true);
    await wrapper.get('#image-max-width').setValue(1200);
    await wrapper.get('#image-max-height').setValue(900);
    await wrapper.get('[data-test=target]').setValue(true);
    await wrapper.get('#image-target-kb').setValue(100);
    await wrapper.get('[data-test=allow-resize]').setValue(true);
    vi.mocked(optimizeImage).mockResolvedValueOnce(
      output({ width: 1200, height: 900, targetMet: false })
    );
    await button('重新压缩').trigger('click');
    await flushPromises();
    expect(optimizeImage).toHaveBeenLastCalledWith(
      expect.any(File),
      expect.objectContaining({
        quality: 0.6,
        maxWidth: 1200,
        maxHeight: 900,
        targetBytes: 102400,
        allowResize: true,
      }),
      expect.any(AbortSignal)
    );
    expect(wrapper.find('.image-compressor__stale').exists()).toBe(false);
    expect(wrapper.get('.image-compressor__target').text()).toContain('未达到');
    expect(button('下载压缩图片').attributes('disabled')).toBeUndefined();
  });

  it('disables PNG quality/targets and sends no budget when converting back to PNG', async () => {
    await upload();
    await wrapper.get('[data-test=target]').setValue(true);
    await wrapper.get('#image-output-format').setValue('image/png');
    expect(wrapper.get('#compression-rate').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[data-test=target]').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('PNG 减色');
    await button('重新压缩').trigger('click');
    await flushPromises();
    expect(optimizeImage).toHaveBeenLastCalledWith(
      expect.any(File),
      expect.objectContaining({
        format: 'image/png',
        targetBytes: undefined,
      }),
      expect.any(AbortSignal)
    );
  });

  it('retains the old image and result when replacement is invalid or fails decoding', async () => {
    await upload();
    const previous = wrapper.get('.image-viewer img').attributes('src');
    await upload(new File(['gif'], 'animated.gif', { type: 'image/gif' }));
    expect(wrapper.text()).toContain('不支持 GIF');
    expect(optimizeImage).toHaveBeenCalledTimes(1);
    vi.mocked(optimizeImage).mockRejectedValueOnce(new ImageOptimizationError('decodeFailed'));
    await upload(new File(['bad'], 'bad.png', { type: 'image/png' }));
    expect(wrapper.text()).toContain('图片无法解码');
    expect(wrapper.get('.image-viewer img').attributes('src')).toBe(previous);
    expect(wrapper.get('.image-compressor__details').text()).toContain('my.photo.webp');
    expect(button('下载压缩图片').attributes('disabled')).toBeUndefined();
  });

  it('ignores late encoding completion after clear and releases existing URLs', async () => {
    await upload();
    let resolve!: (value: OptimizedImage) => void;
    vi.mocked(optimizeImage).mockImplementationOnce(
      () =>
        new Promise(done => {
          resolve = done;
        })
    );
    await button('重新压缩').trigger('click');
    const signal = vi.mocked(optimizeImage).mock.calls[1][2]!;
    await button('清空').trigger('click');
    expect(signal.aborted).toBe(true);
    resolve(output());
    await flushPromises();
    expect(wrapper.find('.image-dropzone').exists()).toBe(true);
    expect(wrapper.find('.image-compressor__metrics').exists()).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('cancels processing and keeps old results, then allows a new attempt', async () => {
    await upload();
    let resolve!: (value: OptimizedImage) => void;
    vi.mocked(optimizeImage).mockImplementationOnce(
      () =>
        new Promise(done => {
          resolve = done;
        })
    );
    await button('重新压缩').trigger('click');
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined();
    await button('取消处理').trigger('click');
    resolve(output({ width: 1 }));
    await flushPromises();
    expect(wrapper.get('.image-compressor__details').text()).toContain('1600 × 1200');
    expect(button('下载压缩图片').attributes('disabled')).toBeUndefined();
  });

  it('exports using actual MIME and original filename and offers the original when output grows', async () => {
    vi.mocked(optimizeImage).mockResolvedValueOnce(
      output({ blob: new Blob(['larger-result'], { type: 'image/png' }) })
    );
    await upload();
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloads.push(this.download);
    });
    await button('下载压缩图片').trigger('click');
    await button('下载原图').trigger('click');
    expect(downloads).toEqual(['my.photo-optimized.png', 'my.photo.webp']);
    expect(wrapper.get('.image-compressor__metrics').text()).toContain('增大');
  });

  it('accepts a pasted image but leaves paste inside editable inputs alone', async () => {
    const pasted = new File(['png'], 'paste.png', { type: 'image/png' });
    await wrapper.get('section').trigger('paste', { clipboardData: { files: [pasted] } });
    await flushPromises();
    expect(optimizeImage).toHaveBeenCalledTimes(1);
    await wrapper.get('#compression-rate').trigger('paste', { clipboardData: { files: [pasted] } });
    expect(optimizeImage).toHaveBeenCalledTimes(1);
  });

  it('does not publish a late Base64 value after settings change', async () => {
    await upload();
    let resolve!: (value: string) => void;
    vi.mocked(blobToDataUrl).mockImplementationOnce(
      () =>
        new Promise(done => {
          resolve = done;
        })
    );
    await button('生成 Base64').trigger('click');
    await wrapper.get('#compression-rate').setValue(0.7);
    resolve('data:image/webp;base64,OLD');
    await flushPromises();
    expect(wrapper.find('textarea').exists()).toBe(false);
  });

  it('shows localized English controls and failures', async () => {
    wrapper.unmount();
    langManager.setLanguage('en');
    wrapper = mount(ImageCompressor);
    await upload(new File(['bad'], 'bad.gif', { type: 'image/gif' }));
    expect(wrapper.text()).toContain('Quality preset');
    expect(wrapper.text()).toContain('GIF and other formats are unsupported');
    expect(wrapper.text()).not.toContain('imageCompressor.');
  });

  it('respects a format chosen before importing the first image', async () => {
    await wrapper.get('#image-output-format').setValue('image/webp');
    await upload(new File(['png'], 'source.png', { type: 'image/png' }));
    expect(optimizeImage).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({ format: 'image/webp' }),
      expect.any(AbortSignal)
    );
  });

  it('keeps stale exports disabled after failure and releases URLs on replacement', async () => {
    await upload();
    await wrapper.get('#compression-rate').setValue(0.7);
    vi.mocked(optimizeImage).mockRejectedValueOnce(new ImageOptimizationError('encodeFailed'));
    await button('重新压缩').trigger('click');
    await flushPromises();
    expect(button('下载压缩图片').attributes('disabled')).toBeDefined();
    expect(wrapper.find('.image-compressor__stale').exists()).toBe(true);
    await upload(new File(['new'], 'replacement.webp', { type: 'image/webp' }));
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(wrapper.get('.image-compressor__details').text()).toContain('replacement.webp');
    expect(button('下载压缩图片').attributes('disabled')).toBeUndefined();
  });

  it('explains original retention, exports exact bytes with the source name, and separates budget status', async () => {
    const source = new File(['source'], 'original.webp', { type: 'image/webp' });
    await wrapper.get('[data-test=target]').setValue(true);
    vi.mocked(optimizeImage).mockResolvedValueOnce(
      output({ blob: source, keptOriginal: true, quality: null })
    );
    await upload(source);
    expect(wrapper.get('.image-compressor__retained').text()).toContain('已保留原文件');
    expect(wrapper.get('.image-compressor__metrics').text()).toContain('体积未变');
    expect(wrapper.get('.image-compressor__target').text()).toContain('已达到');
    const downloads: Array<{ href: string; name: string }> = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloads.push({ href: this.href, name: this.download });
    });
    await button('下载原图').trigger('click');
    expect(downloads).toEqual([{ href: 'blob:test-1', name: 'original.webp' }]);
    expect(URL.createObjectURL).toHaveBeenCalledWith(source);
    await button('生成 Base64').trigger('click');
    await flushPromises();
    expect(blobToDataUrl).toHaveBeenCalledWith(source);
    await wrapper.get('#compression-rate').setValue(0.6);
    expect(wrapper.find('.image-compressor__retained').exists()).toBe(false);
    expect(button('下载原图').attributes('disabled')).toBeDefined();
  });
});
