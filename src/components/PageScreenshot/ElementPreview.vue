<template>
  <tool-workspace class="element-preview" :title="t('pageScreenshot.previewTip')">
    <tool-state v-if="errorMessage" state="error" :message="errorMessage" />
    <tool-state v-else-if="!dataUrl" state="loading" :message="t('pageScreenshot.capturing')" />
    <inline-feedback :feedback="feedback" />
    <template v-if="dataUrl">
      <div class="element-preview__image">
        <image-viewer :src="dataUrl" :alt="t('pageScreenshot.previewTip')" />
      </div>
      <button class="u-btn_il g-mt20" s-color="blue" :disabled="saving" @click="save">
        {{ t('pageScreenshot.saveToLocal') }}
      </button>
    </template>
  </tool-workspace>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import ToolWorkspace from '@/components/Experience/ToolWorkspace.vue';
import ImageViewer from '@/components/Experience/ImageViewer.vue';
import ToolState from '@/components/Experience/ToolState.vue';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import { langManager } from '@/utils/i18n';
import { sendRuntimeMessage } from '@/extension/chrome-client';
import { isDownloadResponse } from '@/extension/messages';
import type { InlineFeedbackMessage } from '@/types/experience';

const t = (key: string) => langManager.t(key);
const dataUrl = ref('');
const filename = ref('');
const saving = ref(false);
const errorMessage = ref('');
const feedback = ref<InlineFeedbackMessage | null>(null);

onMounted(async () => {
  try {
    const id = new URLSearchParams(window.location.search).get('captureId');
    if (!id || !/^[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid capture');
    const key = `element-screenshot:${id}`;
    const stored = await chrome.storage.session.get(key);
    const result = stored[key];
    if (
      !result ||
      typeof result.dataUrl !== 'string' ||
      !result.dataUrl.startsWith('data:image/png;base64,') ||
      typeof result.filename !== 'string'
    )
      throw new Error('Missing capture');
    dataUrl.value = result.dataUrl;
    filename.value = result.filename;
  } catch {
    errorMessage.value = t('pageScreenshot.errorCapture');
  }
});

const save = async () => {
  if (saving.value || !dataUrl.value) return;
  saving.value = true;
  errorMessage.value = '';
  try {
    const response = await sendRuntimeMessage(
      { action: 'downloadImage', dataUrl: dataUrl.value, filename: filename.value },
      isDownloadResponse
    );
    if (!response.success) throw new Error('Download failed');
    feedback.value = { message: t('pageScreenshot.saveSuccess'), tone: 'success' };
  } catch {
    errorMessage.value = t('pageScreenshot.errorCapture');
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.element-preview {
  width: min(1000px, calc(100vw - 48px));
  margin: 24px auto;
}
.element-preview__image {
  overflow: auto;
  max-height: 75vh;
}
.element-preview__image img {
  display: block;
  max-width: 100%;
  height: auto;
}
</style>
