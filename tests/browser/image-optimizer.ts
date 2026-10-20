import { createApp, nextTick } from 'vue';
import ImageCompressor from '@/components/ImageCompressor/index.vue';
import { optimizeImage, type OptimizeOptions } from '@/components/ImageCompressor/optimizer';
import { langManager } from '@/utils/i18n';
import 'moo-css-base/pc.css';
import '@/styles/popup.less';
import '@/styles/i18n.less';
import '@/styles/experience.less';

// Standalone real-browser fixture: no Chrome API mocks or simulated encoder results.
const checks: Array<{ name: string; passed: boolean; detail?: unknown }> = [];
const assert = (name: string, passed: boolean, detail?: unknown) => {
  checks.push({ name, passed, detail });
  if (!passed) throw new Error(name);
};
const defaults: OptimizeOptions = {
  format: 'image/jpeg',
  quality: 0.8,
  allowResize: false,
  background: '#ffffff',
};
const makeBlob = (canvas: HTMLCanvasElement, format = 'image/png', quality?: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('fixture encoding failed'))),
      format,
      quality
    )
  );

async function pixels(blob: Blob) {
  const image = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(image, 0, 0);
  const pixel = Array.from(context.getImageData(0, 0, 1, 1).data);
  const dimensions = { width: image.width, height: image.height };
  image.close();
  return { pixel, ...dimensions };
}

async function waitUntil(predicate: () => boolean) {
  for (let attempt = 0; attempt < 400; attempt++) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error('Timed out waiting for UI');
}

function click(text: string) {
  const button = Array.from(document.querySelectorAll('button')).find(
    item => item.textContent?.trim() === text
  );
  if (!button) throw new Error(`Missing button: ${text}`);
  button.click();
}

async function change(selector: string, value: string | boolean) {
  const input = document.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
  if (typeof value === 'boolean') (input as HTMLInputElement).checked = value;
  else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await nextTick();
}

async function run() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const context = canvas.getContext('2d')!;
  // Transparent corner plus detailed, deterministic pixels makes alpha and budgets testable.
  const image = context.createImageData(1200, 900);
  let seed = 42;
  for (let offset = 0; offset < image.data.length; offset += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    image.data[offset] = seed & 255;
    image.data[offset + 1] = (seed >>> 8) & 255;
    image.data[offset + 2] = (seed >>> 16) & 255;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  context.clearRect(0, 0, 50, 50);
  const source = new File([await makeBlob(canvas)], 'detailed.source.png', { type: 'image/png' });
  const png = await optimizeImage(source, { ...defaults, format: 'image/png' });
  const decodedPng = await pixels(png.blob);
  assert(
    'preserve dimensions and PNG alpha',
    decodedPng.width === 1200 && decodedPng.height === 900 && decodedPng.pixel[3] === 0,
    decodedPng
  );
  const webp = await optimizeImage(source, {
    ...defaults,
    format: 'image/webp',
    maxWidth: 600,
    maxHeight: 600,
  });
  const decodedWebp = await pixels(webp.blob);
  assert(
    'WebP MIME, dimensions and alpha',
    webp.blob.type === 'image/webp' &&
      decodedWebp.width === 600 &&
      decodedWebp.height === 450 &&
      decodedWebp.pixel[3] === 0,
    decodedWebp
  );
  const jpeg = await optimizeImage(source, { ...defaults, background: '#ff0000' });
  const decodedJpeg = await pixels(jpeg.blob);
  assert(
    'JPEG explicit background and opaque alpha',
    decodedJpeg.pixel[0] > 240 &&
      decodedJpeg.pixel[1] < 10 &&
      decodedJpeg.pixel[2] < 10 &&
      decodedJpeg.pixel[3] === 255,
    decodedJpeg
  );
  const minimum = await optimizeImage(source, { ...defaults, quality: 0.35 });
  const budget = Math.floor((minimum.blob.size + jpeg.blob.size) / 2);
  const targeted = await optimizeImage(source, { ...defaults, targetBytes: budget });
  assert(
    'real target budget achieved without resizing',
    targeted.targetMet && targeted.blob.size <= budget && targeted.width === 1200,
    { budget, bytes: targeted.blob.size, quality: targeted.quality }
  );
  const missed = await optimizeImage(source, { ...defaults, targetBytes: 1 });
  assert(
    'impossible budget reported honestly',
    !missed.targetMet && missed.width === 1200 && missed.blob.size > 1
  );
  const resized = await optimizeImage(source, {
    ...defaults,
    targetBytes: minimum.blob.size - 1000,
    allowResize: true,
  });
  assert('opt-in shrinking meets budget', resized.targetMet && resized.width < 1200, {
    bytes: resized.blob.size,
    width: resized.width,
  });

  const compact = new File([await makeBlob(canvas, 'image/jpeg', 0.1)], 'already-small.jpg', {
    type: 'image/jpeg',
  });
  const expensive = await makeBlob(canvas, 'image/jpeg', 0.95);
  const retained = await optimizeImage(compact, {
    ...defaults,
    quality: 0.95,
    targetBytes: compact.size + 1,
  });
  assert(
    'already compressed JPEG retains exact source and meets budget without claiming savings',
    expensive.size > compact.size &&
      retained.blob === compact &&
      retained.keptOriginal &&
      retained.targetMet &&
      retained.quality === null,
    { original: compact.size, reencoded: expensive.size, selected: retained.blob.size }
  );
  const conversion = await optimizeImage(compact, { ...defaults, format: 'image/png' });
  assert(
    'explicit larger PNG conversion is preserved',
    !conversion.keptOriginal &&
      conversion.blob.type === 'image/png' &&
      conversion.blob.size > compact.size
  );
  const tinyCanvas = document.createElement('canvas');
  tinyCanvas.width = tinyCanvas.height = 1;
  const tiny = new File([await makeBlob(tinyCanvas)], 'tiny.png', { type: 'image/png' });
  const tinyResult = await optimizeImage(tiny, { ...defaults, format: 'image/png' });
  assert(
    'tiny PNG preserves exact source on no improvement',
    tinyResult.keptOriginal && tinyResult.blob === tiny
  );

  const locale = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh';
  langManager.setLanguage(locale);
  const t = (key: string) => langManager.t(`imageCompressor.${key}`);
  const app = createApp(ImageCompressor);
  app.mount('#app');
  const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
  const transfer = new DataTransfer();
  transfer.items.add(source);
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await waitUntil(() => Boolean(document.querySelector('.image-compressor__metrics')));
  assert(
    'real file upload produces dimensions and size metrics',
    document.querySelector('.image-compressor__details')!.textContent!.includes('1200 × 900')
  );
  assert('Base64 stays lazy', !document.querySelector('textarea'));
  assert(
    'UI explains retained source and unchanged size',
    Boolean(document.querySelector('.image-compressor__retained')) &&
      document.querySelector('.image-compressor__metrics')!.textContent!.includes(t('unchanged'))
  );
  const originalHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', await source.arrayBuffer()))
  )
    .map(value => value.toString(16).padStart(2, '0'))
    .join('');
  click(t('downloadOriginal'));
  await change('#image-output-format', 'image/webp');
  assert(
    'settings mark result stale and disable export',
    Boolean(document.querySelector('.image-compressor__stale')) &&
      document.querySelector<HTMLButtonElement>('[data-test=download]')!.disabled
  );
  await change('[data-test=resize]', true);
  await change('#image-max-width', '600');
  await change('#image-max-height', '600');
  click(t('compress'));
  await waitUntil(
    () =>
      !document.querySelector('.image-compressor__stale') &&
      !document.querySelector('fieldset[disabled]')
  );
  assert(
    'real UI resize/format change',
    document.querySelector('.image-compressor__details')!.textContent!.includes('600 × 450') &&
      document.querySelector('.image-compressor__details')!.textContent!.includes('WEBP')
  );
  const details = document.querySelector('details')!;
  details.open = true;
  click(t('generateBase64'));
  await waitUntil(() => Boolean(document.querySelector('textarea')));
  assert(
    'on-demand Base64 matches chosen format',
    document.querySelector('textarea')!.value.startsWith('data:image/webp;base64,')
  );
  const expectedDownloadBytes = atob(
    document.querySelector('textarea')!.value.split(',')[1]
  ).length;
  click(t('download'));
  const bad = new DataTransfer();
  bad.items.add(new File(['GIF89a'], 'animation.gif', { type: 'image/gif' }));
  input.files = bad.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await nextTick();
  assert(
    'unsupported replacement preserves last image',
    Boolean(document.querySelector('.image-compressor__metrics')) &&
      document.body.textContent!.includes('GIF')
  );
  assert(
    'no raw localization keys',
    !document.querySelector('#app')!.textContent!.includes('imageCompressor.')
  );
  assert('no horizontal page overflow', document.documentElement.scrollWidth <= window.innerWidth, {
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  });
  return {
    locale,
    downloadName: 'detailed.source-optimized.webp',
    originalDownloadName: source.name,
    originalHash,
    expectedDownloadBytes,
    sourceBytes: source.size,
    pngBytes: png.blob.size,
    webpBytes: webp.blob.size,
    jpegBytes: jpeg.blob.size,
  };
}

run()
  .then(result => {
    document.querySelector('#report')!.textContent = JSON.stringify(
      { status: 'PASS', checks, result },
      null,
      2
    );
    document.title = 'PASS: image optimizer';
  })
  .catch(error => {
    document.querySelector('#report')!.textContent = JSON.stringify(
      { status: 'FAIL', checks, error: String(error), stack: error.stack },
      null,
      2
    );
    document.title = 'FAIL: image optimizer';
  });
