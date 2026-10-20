import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue';
import { langManager } from '@/utils/i18n';
import {
  blobToDataUrl,
  ImageOptimizationError,
  optimizeImage,
  outputFilename,
  type OptimizedImage,
  type OptimizeOptions,
  type OutputFormat,
} from './optimizer';

export function useImageOptimizer() {
  const t = (key: string, params?: Record<string, string | number>) =>
    langManager.t(`imageCompressor.${key}`, params);
  const settings = reactive({
    format: 'image/jpeg' as OutputFormat,
    quality: 0.8,
    resize: false,
    maxWidth: 1920,
    maxHeight: 1920,
    target: false,
    targetKB: 200,
    allowResize: false,
    background: '#ffffff',
  });
  const file = shallowRef<File>();
  const result = shallowRef<OptimizedImage>();
  const originalUrl = ref('');
  const resultUrl = ref('');
  const base64 = ref('');
  const base64Loading = ref(false);
  const processing = ref(false);
  const stale = ref(false);
  const error = ref('');
  const previewMode = ref<'original' | 'result'>('original');
  let controller: AbortController | undefined;
  let generation = 0;
  let matchingSource = false;
  let formatPicked = false;
  watch(
    () => settings.format,
    () => {
      if (!matchingSource) formatPicked = true;
    },
    { flush: 'sync' }
  );
  const canExport = computed(() => Boolean(result.value) && !stale.value && !processing.value);
  const savings = computed(() =>
    file.value && result.value ? (1 - result.value.blob.size / file.value.size) * 100 : 0
  );
  watch(
    settings,
    () => {
      if (result.value) stale.value = true;
      base64.value = '';
      generation++;
      controller?.abort();
      processing.value = false;
      base64Loading.value = false;
    },
    { flush: 'sync' }
  );

  function options(): OptimizeOptions {
    return {
      format: settings.format,
      quality: Number(settings.quality),
      maxWidth: settings.resize ? Number(settings.maxWidth) : undefined,
      maxHeight: settings.resize ? Number(settings.maxHeight) : undefined,
      targetBytes:
        settings.target && settings.format !== 'image/png'
          ? Number(settings.targetKB) * 1024
          : undefined,
      allowResize: settings.allowResize,
      background: settings.background,
    };
  }

  function reportError(cause: unknown) {
    error.value = t(
      `errors.${cause instanceof ImageOptimizationError ? cause.code : 'encodeFailed'}`
    );
  }

  async function run(nextFile = file.value, replacement = false) {
    if (!nextFile) return;
    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;
    const current = ++generation;
    const config = options();
    processing.value = true;
    base64Loading.value = false;
    error.value = '';
    try {
      const output = await optimizeImage(nextFile, config, signal);
      if (current !== generation) return;
      const nextResultUrl = URL.createObjectURL(output.blob);
      if (replacement) {
        const nextOriginalUrl = URL.createObjectURL(nextFile);
        if (originalUrl.value) URL.revokeObjectURL(originalUrl.value);
        originalUrl.value = nextOriginalUrl;
        file.value = nextFile;
        previewMode.value = 'original';
      }
      if (resultUrl.value) URL.revokeObjectURL(resultUrl.value);
      resultUrl.value = nextResultUrl;
      result.value = output;
      base64.value = '';
      stale.value = false;
    } catch (cause) {
      if (current === generation && !signal.aborted) reportError(cause);
    } finally {
      if (current === generation) processing.value = false;
    }
  }

  function handleFiles(files?: ArrayLike<File> | null) {
    const next = files?.[0];
    if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type)) {
      error.value = t('errors.unsupported');
      return;
    }
    // Import defaults follow the source only for the first image. Replacements keep user settings.
    if (!file.value && !formatPicked) {
      matchingSource = true;
      settings.format = next.type as OutputFormat;
      matchingSource = false;
    }
    return run(next, true);
  }

  function onPaste(event: ClipboardEvent) {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest('input, textarea, [contenteditable="true"]')
    )
      return;
    const images = Array.from(event.clipboardData?.files || []);
    if (!images.length) return;
    event.preventDefault();
    void handleFiles(images);
  }

  function download(original = false) {
    if (!file.value || (!original && !canExport.value)) return;
    const link = document.createElement('a');
    link.href = original ? originalUrl.value : resultUrl.value;
    link.download =
      original || result.value?.keptOriginal
        ? file.value.name
        : outputFilename(file.value.name, result.value!.blob.type as OutputFormat);
    link.click();
  }

  async function generateBase64() {
    if (!canExport.value || !result.value) return;
    const current = generation;
    base64Loading.value = true;
    try {
      const value = await blobToDataUrl(result.value.blob);
      if (current === generation) base64.value = value;
    } catch (cause) {
      if (current === generation) reportError(cause);
    } finally {
      if (current === generation) base64Loading.value = false;
    }
  }

  function cancel() {
    generation++;
    controller?.abort();
    processing.value = false;
    base64Loading.value = false;
  }

  function reset() {
    cancel();
    if (originalUrl.value) URL.revokeObjectURL(originalUrl.value);
    if (resultUrl.value) URL.revokeObjectURL(resultUrl.value);
    originalUrl.value = resultUrl.value = base64.value = '';
    file.value = result.value = undefined;
    stale.value = false;
    error.value = '';
    previewMode.value = 'original';
  }
  onBeforeUnmount(reset);
  return {
    t,
    settings,
    file,
    result,
    originalUrl,
    resultUrl,
    base64,
    base64Loading,
    processing,
    stale,
    error,
    previewMode,
    canExport,
    savings,
    run,
    handleFiles,
    onPaste,
    download,
    generateBase64,
    cancel,
    reset,
  };
}
