<template>
  <section class="converter-tool qr-tool">
    <label for="qr-source">{{ t('qrcode.sourceLabel') }}</label>
    <div class="converter-tool__row">
      <input
        id="qr-source"
        ref="sourceInput"
        v-model="originWords"
        :placeholder="t('qrcode.inputPlaceholder')"
        class="u-input"
        type="text"
        :aria-invalid="Boolean(error)"
        aria-describedby="qr-feedback"
        @keydown.enter="generateQr"
      />
      <button class="u-btn" s-color="blue" @click="generateQr">
        {{ qrUrl ? t('qrcode.regenerate') : t('qrcode.generate') }}
      </button>
      <button type="button" class="u-btn" :disabled="!originWords" @click="reset">
        {{ t('common.clear') }}
      </button>
    </div>
    <inline-feedback
      :feedback="error ? { id: 'qr-feedback', message: error, tone: 'validation' } : feedback"
    />
    <div v-if="qrUrl" class="qr-tool__result">
      <img class="qr-tool__image" :src="qrUrl" :alt="t('qrcode.previewAlt')" />
      <button class="u-btn" s-color="blue" @click="downloadQr">
        {{ t('qrcode.downloadSvg') }}
      </button>
    </div>
    <tool-state v-else state="empty" :message="t('qrcode.emptyPreview')" />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { langManager } from '@/utils/i18n';
import { getLocalTabUrl } from '@/utils/chrome';
import { handleQRCode } from '@/utils';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import ToolState from '@/components/Experience/ToolState.vue';
import type { InlineFeedbackMessage } from '@/types/experience';

defineOptions({ name: 'QRCode' });

const props = withDefaults(defineProps<{ keywords?: string }>(), { keywords: '' });
const t = (key: string) => langManager.t(key);
const originWords = ref('');
const qrUrl = ref('');
const generatedValue = ref('');
const error = ref('');
const feedback = ref<InlineFeedbackMessage | null>(null);
const sourceInput = ref<HTMLInputElement | null>(null);

const generateQr = () => {
  const value = originWords.value.trim();
  error.value = '';
  feedback.value = null;
  if (!value) {
    error.value = t('qrcode.messages.required');
    sourceInput.value?.focus();
    return;
  }
  try {
    generatedValue.value = value;
    qrUrl.value = handleQRCode(value)?.getImgUrl() || '';
    feedback.value = { message: t('qrcode.messages.generated'), tone: 'success' };
  } catch (cause) {
    error.value = (cause as Error).message || t('qrcode.messages.generateFailed');
  }
};

const downloadQr = () => {
  if (!generatedValue.value) return;
  handleQRCode(generatedValue.value)?.downloadQR('svg');
  feedback.value = { message: t('experience.downloaded'), tone: 'success' };
};

const reset = () => {
  originWords.value = '';
  qrUrl.value = '';
  generatedValue.value = '';
  error.value = '';
  feedback.value = null;
  sourceInput.value?.focus();
};

watch(
  () => props.keywords,
  value => {
    if (value && value !== originWords.value) {
      originWords.value = value;
      generateQr();
    }
  }
);

onMounted(() => {
  if (props.keywords) {
    originWords.value = props.keywords;
    generateQr();
    return;
  }
  getLocalTabUrl((url: string) => {
    originWords.value = url || '';
    if (url) generateQr();
  });
});
</script>

<style scoped>
.qr-tool__result {
  display: grid;
  justify-items: center;
  gap: 12px;
  margin-top: 12px;
}
.qr-tool__image {
  width: 200px;
  max-width: 100%;
}
</style>
