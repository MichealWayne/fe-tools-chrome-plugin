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
        :aria-invalid="Boolean(error)"
      />
    </label>
    <div class="converter-tool__actions">
      <button type="button" :disabled="!imgUrl || processing" @click="compress">
        {{ t('imageCompressor.compress') }}
      </button>
      <button type="button" :disabled="!base64Result" @click="copyResult">
        {{ t('common.copy') }}
      </button>
      <button type="button" :disabled="!base64Result" @click="downloadResult">
        {{ t('imageCompressor.download') }}
      </button>
      <button type="button" :disabled="!imgUrl" @click="reset">{{ t('common.clear') }}</button>
    </div>
    <tool-state v-if="processing" state="loading" :message="t('imageCompressor.processing')" />
    <inline-feedback :feedback="error ? { message: error, tone: 'error' } : feedback" />
    <textarea
      v-if="base64Result"
      v-model="base64Result"
      readonly
      :aria-label="t('imageCompressor.base64Label')"
    ></textarea>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { langManager } from '@/utils/i18n';
import { getFileBase64 } from '@/utils';
import { getCompressedImageBase64, handleInputUploadImageFile } from '@/utils/image';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import ToolState from '@/components/Experience/ToolState.vue';
import type { InlineFeedbackMessage } from '@/types/experience';
import IconInbox from './IconInbox.vue';

defineOptions({ name: 'ImageCompressor' });

const t = (key: string) => langManager.t(key);
const fileInput = ref<HTMLInputElement | null>(null);
const compressRate = ref('0.8');
const imgUrl = ref('');
const base64Result = ref('');
const originalBase64 = ref('');
const processing = ref(false);
const error = ref('');
const feedback = ref<InlineFeedbackMessage | null>(null);

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
  processing.value = true;
  error.value = '';
  feedback.value = null;
  getFileBase64(file, value => {
    originalBase64.value = value;
  });
  try {
    const result = await handleInputUploadImageFile(files || undefined, validRate());
    releasePreviewUrl();
    imgUrl.value = result.imgUrl;
    base64Result.value = result.base64result;
    feedback.value = { message: t('imageCompressor.messages.ready'), tone: 'success' };
  } catch (cause) {
    error.value = (cause as Error).message || t('imageCompressor.messages.convertFailed');
  } finally {
    processing.value = false;
  }
};

const onFileChange = (event: Event) => handleFiles((event.target as HTMLInputElement).files);
const onDrop = (event: DragEvent) => handleFiles(event.dataTransfer?.files);

const compress = async () => {
  if (!imgUrl.value) return;
  processing.value = true;
  error.value = '';
  try {
    base64Result.value = await getCompressedImageBase64(imgUrl.value, validRate());
    feedback.value = { message: t('imageCompressor.messages.ready'), tone: 'success' };
  } catch (cause) {
    error.value = (cause as Error).message || t('imageCompressor.messages.convertFailed');
  } finally {
    processing.value = false;
  }
};

const copyResult = async () => {
  await navigator.clipboard.writeText(base64Result.value);
  feedback.value = { message: t('experience.copied'), tone: 'success' };
};

const downloadResult = () => {
  const link = document.createElement('a');
  link.href = base64Result.value;
  link.download = 'compressed-image.png';
  link.click();
  feedback.value = { message: t('experience.downloaded'), tone: 'success' };
};

const reset = () => {
  releasePreviewUrl();
  imgUrl.value = '';
  base64Result.value = '';
  originalBase64.value = '';
  error.value = '';
  feedback.value = null;
  if (fileInput.value) fileInput.value.value = '';
};
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
