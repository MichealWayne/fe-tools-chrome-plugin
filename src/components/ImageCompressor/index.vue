<template>
  <section class="media-tool image-compressor">
    <input
      ref="fileInput"
      class="z-hide"
      type="file"
      accept="image/jpeg,image/png,image/gif"
      @change="onFileChange"
    />
    <button
      v-if="!imgUrl"
      type="button"
      class="image-dropzone"
      @click="fileInput?.click()"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <icon-inbox />
      <span>{{ t('imageCompressor.dragTip') }}</span>
      <small>{{ t('imageCompressor.formatTip') }}</small>
    </button>
    <div v-else class="image-compressor__preview">
      <img :src="imgUrl" :alt="t('imageCompressor.previewAlt')" />
    </div>

    <label class="converter-field" for="compression-rate">
      <span>{{ t('imageCompressor.ratioLabel') }}</span>
      <input
        id="compression-rate"
        v-model="compressRate"
        type="number"
        min="0.01"
        max="1"
        step="0.05"
        :disabled="outputFormat === 'image/png'"
        :aria-invalid="Boolean(error)"
      />
    </label>
    <label class="converter-field" for="image-output-format">
      <span>{{ t('imageCompressor.outputFormat') }}</span>
      <select
        id="image-output-format"
        v-model="outputFormat"
        :disabled="processing"
        @change="compress"
      >
        <option value="image/jpeg">{{ t('imageCompressor.jpegFormat') }}</option>
        <option value="image/png">{{ t('imageCompressor.pngFormat') }}</option>
      </select>
    </label>
    <p v-if="outputFormat === 'image/png'">{{ t('imageCompressor.pngQualityHint') }}</p>
    <div class="converter-tool__actions">
      <button
        class="u-btn"
        s-color="blue"
        type="button"
        :disabled="!imgUrl || processing"
        @click="compress"
      >
        {{ t('imageCompressor.compress') }}
      </button>
      <button class="u-btn" type="button" :disabled="!base64Result" @click="copyResult">
        {{ t('imageCompressor.copyBase64') }}
      </button>
      <button class="u-btn" type="button" :disabled="!base64Result" @click="downloadResult">
        {{ t('imageCompressor.download') }}
      </button>
      <button class="u-btn" type="button" :disabled="!imgUrl" @click="reset">
        {{ t('common.clear') }}
      </button>
    </div>
    <tool-state v-if="processing" state="loading" :message="t('imageCompressor.processing')" />
    <inline-feedback :feedback="error ? { message: error, tone: 'error' } : feedback" />
    <p v-if="outputDetails" class="image-compressor__details">{{ outputDetails }}</p>
    <textarea
      v-if="base64Result"
      v-model="base64Result"
      readonly
      :aria-label="t('imageCompressor.base64Label')"
    ></textarea>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { langManager } from '@/utils/i18n';
import {
  getCompressedImageBase64,
  handleInputUploadImageFile,
  type ImageOutputFormat,
} from '@/utils/image';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import ToolState from '@/components/Experience/ToolState.vue';
import type { InlineFeedbackMessage } from '@/types/experience';
import IconInbox from './IconInbox.vue';

defineOptions({ name: 'ImageCompressor' });

const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);
const fileInput = ref<HTMLInputElement | null>(null);
const compressRate = ref('0.8');
const outputFormat = ref<ImageOutputFormat>('image/jpeg');
const imgUrl = ref('');
const base64Result = ref('');
const outputWidth = ref(0);
const outputHeight = ref(0);
const processing = ref(false);
const error = ref('');
const feedback = ref<InlineFeedbackMessage | null>(null);
let operationId = 0;
const outputDetails = computed(() => {
  if (!base64Result.value || !outputWidth.value || !outputHeight.value) return '';
  const encoded = base64Result.value.split(',')[1] || '';
  const bytes = Math.max(
    0,
    Math.floor((encoded.length * 3) / 4) - (encoded.match(/=+$/)?.[0].length || 0)
  );
  const size = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
  return t('imageCompressor.outputDetails', {
    width: outputWidth.value,
    height: outputHeight.value,
    size,
  });
});

const releasePreviewUrl = () => {
  if (imgUrl.value.startsWith('blob:')) URL.revokeObjectURL(imgUrl.value);
};

const validRate = () => {
  const value = Number(compressRate.value);
  if (!Number.isFinite(value) || value <= 0 || value > 1)
    throw new Error(t('imageCompressor.messages.invalidRate'));
  return value;
};

const handleFiles = async (files?: FileList | null) => {
  const file = files?.[0];
  if (!file || !file.type.startsWith('image/')) {
    error.value = t('imageCompressor.messages.invalidFile');
    return;
  }
  const currentOperation = ++operationId;
  processing.value = true;
  error.value = '';
  feedback.value = null;
  base64Result.value = '';
  outputWidth.value = 0;
  outputHeight.value = 0;
  try {
    outputFormat.value = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const result = await handleInputUploadImageFile(
      files || undefined,
      validRate(),
      outputFormat.value
    );
    if (currentOperation !== operationId) {
      URL.revokeObjectURL(result.imgUrl);
      return;
    }
    releasePreviewUrl();
    imgUrl.value = result.imgUrl;
    base64Result.value = result.base64result;
    outputWidth.value = result.width || 0;
    outputHeight.value = result.height || 0;
    feedback.value = { message: t('imageCompressor.messages.ready'), tone: 'success' };
  } catch (cause) {
    if (currentOperation === operationId)
      error.value = (cause as Error).message || t('imageCompressor.messages.convertFailed');
  } finally {
    if (currentOperation === operationId) processing.value = false;
  }
};

const onFileChange = (event: Event) => handleFiles((event.target as HTMLInputElement).files);
const onDrop = (event: DragEvent) => handleFiles(event.dataTransfer?.files);

const compress = async () => {
  if (!imgUrl.value || processing.value) return;
  const currentOperation = ++operationId;
  processing.value = true;
  error.value = '';
  feedback.value = null;
  base64Result.value = '';
  try {
    const result = await getCompressedImageBase64(imgUrl.value, validRate(), outputFormat.value);
    if (currentOperation !== operationId) return;
    base64Result.value = result;
    feedback.value = { message: t('imageCompressor.messages.ready'), tone: 'success' };
  } catch (cause) {
    if (currentOperation === operationId)
      error.value = (cause as Error).message || t('imageCompressor.messages.convertFailed');
  } finally {
    if (currentOperation === operationId) processing.value = false;
  }
};

const copyResult = async () => {
  await navigator.clipboard.writeText(base64Result.value);
  feedback.value = { message: t('experience.copied'), tone: 'success' };
};

const downloadResult = () => {
  const link = document.createElement('a');
  link.href = base64Result.value;
  link.download = `compressed-image.${base64Result.value.startsWith('data:image/png') ? 'png' : 'jpg'}`;
  link.click();
  feedback.value = { message: t('experience.downloaded'), tone: 'success' };
};

const reset = () => {
  operationId += 1;
  processing.value = false;
  releasePreviewUrl();
  imgUrl.value = '';
  base64Result.value = '';
  outputWidth.value = 0;
  outputHeight.value = 0;
  error.value = '';
  feedback.value = null;
  if (fileInput.value) fileInput.value.value = '';
};
onBeforeUnmount(() => {
  operationId += 1;
  releasePreviewUrl();
});
</script>

<style scoped>
.image-compressor {
  display: grid;
  gap: 12px;
}
.image-dropzone {
  display: grid;
  justify-items: center;
  gap: 6px;
  min-height: 170px;
  border: 2px dashed var(--color-border);
  border-radius: 10px;
  background: var(--color-background);
  cursor: pointer;
}
.image-compressor__preview img {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
}
.image-compressor textarea {
  min-height: 70px;
}
</style>
