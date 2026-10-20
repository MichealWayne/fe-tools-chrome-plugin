export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface OptimizeOptions {
  format: OutputFormat;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  targetBytes?: number;
  allowResize: boolean;
  background: string;
}

export interface OptimizedImage {
  blob: Blob;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  quality: number | null;
  targetMet: boolean;
  keptOriginal: boolean;
}

export class ImageOptimizationError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

const fail = (code: string): never => {
  throw new ImageOptimizationError(code);
};

const checkAbort = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
};

/** Fit within explicit limits without upscaling or changing aspect ratio. */
export function fitDimensions(width: number, height: number, maxWidth = width, maxHeight = height) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
}

function validateOptions(options: OptimizeOptions) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(options.format)) fail('unsupported');
  if (!Number.isFinite(options.quality) || options.quality <= 0 || options.quality > 1)
    fail('invalidQuality');
  for (const dimension of [options.maxWidth, options.maxHeight]) {
    if (
      dimension !== undefined &&
      (!Number.isInteger(dimension) || dimension < 1 || dimension > 16384)
    )
      fail('invalidDimensions');
  }
  if (options.targetBytes !== undefined) {
    if (!Number.isFinite(options.targetBytes) || options.targetBytes < 1) fail('invalidTarget');
    if (options.format === 'image/png') fail('pngTarget');
  }
  if (!/^#[\da-f]{6}$/i.test(options.background)) fail('invalidBackground');
}

/** Inspect container chunks rather than searching compressed pixel bytes for animation markers. */
async function validateFile(file: File, signal?: AbortSignal) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) fail('unsupported');
  if (!file.size || file.size > 30 * 1024 * 1024) fail('fileLimit');
  const bytes = new Uint8Array(await file.arrayBuffer());
  checkAbort(signal);
  const view = new DataView(bytes.buffer);
  const tag = (offset: number, value: string) =>
    [...value].every((char, index) => bytes[offset + index] === char.charCodeAt(0));
  if (file.type === 'image/png') {
    if (!tag(0, '\x89PNG\r\n\x1a\n')) fail('decodeFailed');
    for (let offset = 8; offset + 12 <= bytes.length; ) {
      const length = view.getUint32(offset);
      if (offset + length + 12 > bytes.length) fail('decodeFailed');
      if (tag(offset + 4, 'acTL')) fail('animated');
      if (tag(offset + 4, 'IEND')) break;
      offset += length + 12;
    }
  } else if (file.type === 'image/webp') {
    if (!tag(0, 'RIFF') || !tag(8, 'WEBP')) fail('decodeFailed');
    for (let offset = 12; offset + 8 <= bytes.length; ) {
      const length = view.getUint32(offset + 4, true);
      if (offset + length + 8 > bytes.length) fail('decodeFailed');
      if (tag(offset, 'ANIM') || tag(offset, 'ANMF')) fail('animated');
      if (tag(offset, 'VP8X') && length >= 1 && bytes[offset + 8] & 2) fail('animated');
      offset += 8 + length + (length % 2);
    }
  } else if (bytes[0] !== 0xff || bytes[1] !== 0xd8) fail('decodeFailed');
}

function loadImage(file: File, signal?: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    const cleanup = () => {
      URL.revokeObjectURL(url);
      image.onload = image.onerror = null;
      signal?.removeEventListener('abort', abort);
    };
    const abort = () => {
      cleanup();
      image.src = '';
      reject(new DOMException('Aborted', 'AbortError'));
    };
    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = () => {
      cleanup();
      reject(new ImageOptimizationError('decodeFailed'));
    };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    else image.src = url;
  });
}

/** Encode locally. Size budgets are best-effort and never imply permission to resize. */
export async function optimizeImage(
  file: File,
  options: OptimizeOptions,
  signal?: AbortSignal
): Promise<OptimizedImage> {
  checkAbort(signal);
  validateOptions(options);
  await validateFile(file, signal);
  const image = await loadImage(file, signal);
  checkAbort(signal);
  const originalWidth = image.naturalWidth;
  const originalHeight = image.naturalHeight;
  if (!originalWidth || !originalHeight) fail('decodeFailed');
  if (originalWidth * originalHeight > 32000000 || originalWidth > 16384 || originalHeight > 16384)
    fail('pixelLimit');
  let { width, height } = fitDimensions(
    originalWidth,
    originalHeight,
    options.maxWidth,
    options.maxHeight
  );
  const canvas = document.createElement('canvas');
  const target = options.targetBytes;
  const original: OptimizedImage | undefined =
    file.type === options.format && width === originalWidth && height === originalHeight
      ? {
          blob: file,
          width,
          height,
          originalWidth,
          originalHeight,
          quality: null,
          targetMet: target === undefined || file.size <= target,
          keptOriginal: true,
        }
      : undefined;
  let smallest = original;
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new ImageOptimizationError('encodeFailed');
    const encode = async (quality: number): Promise<OptimizedImage> => {
      checkAbort(signal);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          value => (value ? resolve(value) : reject(new ImageOptimizationError('encodeFailed'))),
          options.format,
          quality
        );
      });
      checkAbort(signal);
      if (blob.type !== options.format) fail('formatUnavailable');
      const candidate: OptimizedImage = {
        blob,
        width,
        height,
        originalWidth,
        originalHeight,
        quality,
        targetMet: target === undefined || blob.size <= target,
        keptOriginal: false,
      };
      if (!smallest || blob.size < smallest.blob.size) smallest = candidate;
      // Re-encoding an already optimized image can grow it and degrade quality.
      // The source is eligible only when it still satisfies the requested output.
      if (
        original &&
        width === original.width &&
        height === original.height &&
        blob.size >= original.blob.size
      )
        return original;
      return candidate;
    };
    for (let round = 0; round < 4; round++) {
      canvas.width = width;
      canvas.height = height;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      if (options.format === 'image/jpeg') {
        context.fillStyle = options.background;
        context.fillRect(0, 0, width, height);
      }
      context.drawImage(image, 0, 0, width, height);
      const upper = await encode(options.quality);
      if (upper.targetMet) return upper;
      let low = Math.min(0.35, options.quality);
      let high = options.quality;
      let best = await encode(low);
      if (best.targetMet) {
        // Keep the highest tested quality that actually meets the byte budget.
        for (let iteration = 0; iteration < 6; iteration++) {
          const quality = (low + high) / 2;
          const candidate = await encode(quality);
          if (candidate.targetMet) {
            best = candidate;
            low = quality;
          } else high = quality;
        }
        return best;
      }
      if (!options.allowResize || (width === 1 && height === 1)) break;
      const next = fitDimensions(
        width,
        height,
        Math.max(1, Math.floor(width * 0.75)),
        Math.max(1, Math.floor(height * 0.75))
      );
      width = next.width;
      height = next.height;
    }
    return smallest!;
  } finally {
    canvas.width = canvas.height = 0;
    image.src = '';
  }
}

export function outputFilename(name: string, format: OutputFormat) {
  const stem = name.replace(/\.[^.]+$/, '') || 'image';
  return `${stem}-optimized.${format === 'image/jpeg' ? 'jpg' : format.split('/')[1]}`;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ImageOptimizationError('encodeFailed'));
    reader.readAsDataURL(blob);
  });
}
