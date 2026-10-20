import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  blobToDataUrl,
  fitDimensions,
  optimizeImage,
  outputFilename,
  type OptimizeOptions,
} from '@/components/ImageCompressor/optimizer';

const defaults: OptimizeOptions = {
  format: 'image/jpeg',
  quality: 0.8,
  allowResize: false,
  background: '#ffffff',
};

const sourceBytes = new Uint8Array(2000);
sourceBytes.set([255, 216, 255]);
function file(type = 'image/jpeg', bytes = sourceBytes) {
  const value = new File([bytes], 'photo.jpg', { type });
  Object.defineProperty(value, 'arrayBuffer', { value: async () => bytes.buffer });
  return value;
}

describe('local image optimization engine', () => {
  let dimensions: { width: number; height: number };
  let context: {
    fillStyle: string;
    fillRect: ReturnType<typeof vi.fn>;
    drawImage: ReturnType<typeof vi.fn>;
  };
  let encodeSize: (quality: number, width: number, height: number) => number;
  let canvases: HTMLCanvasElement[];
  let toBlob: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dimensions = { width: 4000, height: 3000 };
    canvases = [];
    context = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() };
    encodeSize = quality => Math.ceil(quality * 1000);
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = dimensions.width;
        naturalHeight = dimensions.height;
        onload?: () => void;
        onerror?: () => void;
        set src(value: string) {
          if (value) queueMicrotask(() => this.onload?.());
        }
      }
    );
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:source'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D
    );
    toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      callback,
      type,
      quality
    ) {
      canvases.push(this);
      callback(new Blob([new Uint8Array(encodeSize(quality!, this.width, this.height))], { type }));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('preserves original dimensions independently of quality and releases resources', async () => {
    const result = await optimizeImage(file(), { ...defaults, quality: 1 });
    expect(result).toMatchObject({
      width: 4000,
      height: 3000,
      originalWidth: 4000,
      originalHeight: 3000,
    });
    expect(result.blob.type).toBe('image/jpeg');
    expect(context.fillStyle).toBe('#ffffff');
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 4000, 3000);
    expect(canvases[0].width).toBe(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:source');
  });

  it('fits both portrait/landscape limits, rounds tiny dimensions and never upscales', async () => {
    expect(fitDimensions(4000, 3000, 1600, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitDimensions(3000, 4000, 1600, 1600)).toEqual({ width: 1200, height: 1600 });
    expect(fitDimensions(100, 50, 1600, 1600)).toEqual({ width: 100, height: 50 });
    expect(fitDimensions(1000, 1, 1, 1)).toEqual({ width: 1, height: 1 });
    expect(
      await optimizeImage(file(), { ...defaults, maxWidth: 1600, maxHeight: 1600 })
    ).toMatchObject({ width: 1600, height: 1200 });
  });

  it('finds a measured budget without silently reducing dimensions', async () => {
    const result = await optimizeImage(file(), { ...defaults, targetBytes: 500 });
    expect(result.targetMet).toBe(true);
    expect(result.blob.size).toBeLessThanOrEqual(500);
    expect(result.quality).toBeGreaterThan(0.48);
    expect(result).toMatchObject({ width: 4000, height: 3000 });
    expect(toBlob).toHaveBeenCalledTimes(8);
  });

  it('reports a miss and returns the smallest candidate, including nonmonotonic encoder results', async () => {
    encodeSize = quality => (quality > 0.5 ? 600 : 900);
    const result = await optimizeImage(file(), { ...defaults, targetBytes: 100 });
    expect(result.targetMet).toBe(false);
    expect(result.blob.size).toBe(600);
    expect(result.width).toBe(4000);
    expect(toBlob).toHaveBeenCalledTimes(2);
  });

  it('only reduces dimensions with permission and bounds unreachable searches', async () => {
    encodeSize = (quality, width, height) => Math.ceil((width * height * quality) / 10000);
    const result = await optimizeImage(file(), {
      ...defaults,
      targetBytes: 300,
      allowResize: true,
    });
    expect(result.targetMet).toBe(true);
    expect(result.width).toBe(3000);
    encodeSize = () => 1000;
    toBlob.mockClear();
    const miss = await optimizeImage(file(), { ...defaults, targetBytes: 1, allowResize: true });
    expect(miss.targetMet).toBe(false);
    expect(toBlob).toHaveBeenCalledTimes(8);
  });

  it.each(['image/png', 'image/webp'] as const)('does not flatten alpha for %s', async format => {
    await optimizeImage(file(), { ...defaults, format });
    expect(context.fillRect).not.toHaveBeenCalled();
  });

  it('uses the selected opaque JPEG background', async () => {
    await optimizeImage(file(), { ...defaults, background: '#ff0000' });
    expect(context.fillStyle).toBe('#ff0000');
  });

  it.each([
    [{ quality: NaN }, 'invalidQuality'],
    [{ quality: 0 }, 'invalidQuality'],
    [{ maxWidth: 0 }, 'invalidDimensions'],
    [{ maxHeight: 1.5 }, 'invalidDimensions'],
    [{ targetBytes: -1 }, 'invalidTarget'],
    [{ targetBytes: NaN }, 'invalidTarget'],
    [{ format: 'image/png', targetBytes: 100 }, 'pngTarget'],
    [{ background: 'transparent' }, 'invalidBackground'],
  ])('rejects invalid options %j before allocating canvas', async (options, code) => {
    await expect(
      optimizeImage(file(), { ...defaults, ...options } as OptimizeOptions)
    ).rejects.toMatchObject({ code });
    expect(toBlob).not.toHaveBeenCalled();
  });

  it('rejects GIF, empty/oversized files, mismatched MIME and excessive decoded pixels', async () => {
    await expect(optimizeImage(file('image/gif'), defaults)).rejects.toMatchObject({
      code: 'unsupported',
    });
    const large = file();
    Object.defineProperty(large, 'size', { value: 31 * 1024 * 1024 });
    await expect(optimizeImage(large, defaults)).rejects.toMatchObject({ code: 'fileLimit' });
    await expect(
      optimizeImage(new File([], 'empty.jpg', { type: 'image/jpeg' }), defaults)
    ).rejects.toMatchObject({ code: 'fileLimit' });
    await expect(optimizeImage(file('image/png'), defaults)).rejects.toMatchObject({
      code: 'decodeFailed',
    });
    dimensions = { width: 10000, height: 4000 };
    await expect(optimizeImage(file(), defaults)).rejects.toMatchObject({ code: 'pixelLimit' });
    expect(toBlob).not.toHaveBeenCalled();
  });

  it('rejects APNG and animated WebP chunks before decoding', async () => {
    const png = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0, 97, 99, 84, 76, 0, 0, 0, 0,
    ]);
    await expect(optimizeImage(file('image/png', png), defaults)).rejects.toMatchObject({
      code: 'animated',
    });
    const webp = new Uint8Array([
      82, 73, 70, 70, 12, 0, 0, 0, 87, 69, 66, 80, 65, 78, 73, 77, 0, 0, 0, 0,
    ]);
    await expect(optimizeImage(file('image/webp', webp), defaults)).rejects.toMatchObject({
      code: 'animated',
    });
  });

  it('rejects format fallback and null output while cleaning the canvas', async () => {
    toBlob.mockImplementationOnce(callback => callback(new Blob(['x'], { type: 'image/png' })));
    await expect(optimizeImage(file(), defaults)).rejects.toMatchObject({
      code: 'formatUnavailable',
    });
    toBlob.mockImplementationOnce(function (this: HTMLCanvasElement, callback) {
      canvases.push(this);
      callback(null);
    });
    await expect(optimizeImage(file(), defaults)).rejects.toMatchObject({ code: 'encodeFailed' });
    expect(canvases.at(-1)?.width).toBe(0);
  });

  it('stops target iteration after cancellation without publishing output', async () => {
    const controller = new AbortController();
    toBlob.mockImplementationOnce(callback => {
      controller.abort();
      callback(new Blob(['x'], { type: 'image/jpeg' }));
    });
    await expect(
      optimizeImage(file(), { ...defaults, targetBytes: 1 }, controller.signal)
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(toBlob).toHaveBeenCalledTimes(1);
  });

  it('names files with the real output extension and creates valid Base64 on demand', async () => {
    expect(outputFilename('my.photo.PNG', 'image/webp')).toBe('my.photo-optimized.webp');
    expect(outputFilename('photo', 'image/jpeg')).toBe('photo-optimized.jpg');
    expect(await blobToDataUrl(new Blob(['abc'], { type: 'image/png' }))).toBe(
      'data:image/png;base64,YWJj'
    );
  });

  it('settles decode failures and aborts pending image loading with URL cleanup', async () => {
    vi.stubGlobal(
      'Image',
      class {
        onerror?: () => void;
        set src(value: string) {
          if (value) queueMicrotask(() => this.onerror?.());
        }
      }
    );
    await expect(optimizeImage(file(), defaults)).rejects.toMatchObject({ code: 'decodeFailed' });
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    const controller = new AbortController();
    vi.stubGlobal(
      'Image',
      class {
        set src(value: string) {
          if (value) queueMicrotask(() => controller.abort());
        }
      }
    );
    await expect(optimizeImage(file(), defaults, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(toBlob).not.toHaveBeenCalled();
  });

  it('rejects missing canvas contexts and propagates encoding exceptions', async () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValueOnce(null);
    await expect(optimizeImage(file(), defaults)).rejects.toMatchObject({ code: 'encodeFailed' });
    toBlob.mockImplementationOnce(() => {
      throw new Error('encoder unavailable');
    });
    await expect(optimizeImage(file(), defaults)).rejects.toThrow('encoder unavailable');
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it.each([2000, 2500])(
    'retains original bytes when same-format output is equal or larger (%i)',
    async size => {
      encodeSize = () => size;
      const source = file();
      const result = await optimizeImage(source, defaults);
      expect(result.blob).toBe(source);
      expect(result).toMatchObject({
        keptOriginal: true,
        quality: null,
        targetMet: true,
        width: 4000,
        height: 3000,
      });
    }
  );

  it('keeps a genuinely smaller encoding and the selected quality', async () => {
    const result = await optimizeImage(file(), defaults);
    expect(result).toMatchObject({ keptOriginal: false, quality: 0.8 });
    expect(result.blob.size).toBe(800);
  });

  it('retains a valid original for ineffective dimension limits and computes its budget independently', async () => {
    encodeSize = () => 3000;
    const source = file();
    const met = await optimizeImage(source, {
      ...defaults,
      maxWidth: 8000,
      targetBytes: 2500,
      allowResize: true,
    });
    expect(met.blob).toBe(source);
    expect(met.targetMet).toBe(true);
    expect(toBlob).toHaveBeenCalledTimes(1);
    toBlob.mockClear();
    const missed = await optimizeImage(source, {
      ...defaults,
      targetBytes: 1000,
      allowResize: true,
    });
    expect(missed.blob).toBe(source);
    expect(missed).toMatchObject({ keptOriginal: true, targetMet: false, width: 4000 });
    expect(toBlob).toHaveBeenCalledTimes(8);
  });

  it.each([{ format: 'image/png' as const }, { maxWidth: 2000 }, { maxHeight: 1500 }])(
    'preserves explicit transformations even when output grows (%j)',
    async transform => {
      encodeSize = () => 3000;
      const result = await optimizeImage(file(), { ...defaults, ...transform });
      expect(result.keptOriginal).toBe(false);
      expect(result.blob.size).toBe(3000);
      if (transform.format) expect(result.blob.type).toBe('image/png');
      else expect(result).toMatchObject({ width: 2000, height: 1500 });
    }
  );
});
