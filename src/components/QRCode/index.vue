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
      <div class="qr-tool__actions">
        <button type="button" class="u-btn" s-color="blue" @click="generateQr">
          {{ qrUrl ? t('qrcode.regenerate') : t('qrcode.generate') }}
        </button>
        <button type="button" class="u-btn" :disabled="!originWords" @click="reset">
          {{ t('common.clear') }}
        </button>
      </div>
    </div>
    <inline-feedback
      :feedback="error ? { id: 'qr-feedback', message: error, tone: 'validation' } : feedback"
    />
    <div v-if="qrUrl" class="qr-tool__result">
      <p v-if="isStale" class="qr-tool__stale" role="status">{{ t('qrcode.stale') }}</p>
      <button
        type="button"
        class="qr-tool__enlarge"
        :aria-label="t('qrcode.enlarge')"
        :disabled="isStale"
        @click="openScan"
      >
        <img class="qr-tool__image" :src="qrUrl" :alt="t('qrcode.previewAlt')" />
        <span>{{ t('qrcode.enlarge') }}</span>
      </button>
      <p class="qr-tool__encoded">{{ t('qrcode.encodedContent') }}: {{ generatedValue }}</p>
      <button
        v-if="!isStandalone"
        type="button"
        class="tool-button"
        :disabled="isStale"
        @click="openStandalone"
      >
        {{ t('qrcode.openScanPage') }}
      </button>
      <button
        class="u-btn qr-tool__download"
        s-color="blue"
        :disabled="isStale"
        @click="downloadQr"
      >
        {{ t('qrcode.downloadSvg') }}
      </button>
    </div>
    <tool-state v-else state="empty" :message="t('qrcode.emptyPreview')" />
    <preview-dialog v-if="scanOpen" :title="t('qrcode.scanTitle')" @close="scanOpen = false">
      <div class="qr-tool__scan-controls">
        <label
          >{{ t('qrcode.scanSize') }}
          <select v-model.number="scanSize" class="tool-input">
            <option :value="320">320px</option>
            <option :value="480">480px</option>
            <option :value="640">640px</option>
          </select></label
        >
      </div>
      <inline-feedback v-if="scanError" :feedback="{ message: scanError, tone: 'error' }" />
      <div v-else class="qr-tool__scan">
        <img :src="scanUrl" :width="scanSize" :alt="t('qrcode.previewAlt')" />
      </div>
      <p class="qr-tool__encoded">{{ t('qrcode.encodedContent') }}: {{ generatedValue }}</p>
    </preview-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import PreviewDialog from '@/components/Experience/PreviewDialog.vue';
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
const scanOpen = ref(false);
const scanSize = ref(480);
const scanUrl = ref('');
const scanError = ref('');
const isStandalone = new URLSearchParams(window.location.search).get('type') === 'qrcode';
const isStale = computed(
  () => Boolean(qrUrl.value) && originWords.value.trim() !== generatedValue.value
);
const renderScan = () => {
  scanError.value = '';
  try {
    const url = handleQRCode(generatedValue.value)?.getImgUrl(scanSize.value);
    if (!url) throw new Error();
    scanUrl.value = url;
  } catch {
    scanUrl.value = '';
    scanError.value = t('qrcode.messages.generateFailed');
  }
};
const openScan = () => {
  if (!isStale.value) {
    renderScan();
    scanOpen.value = true;
  }
};
watch(scanSize, renderScan);
watch(
  originWords,
  () => {
    scanOpen.value = false;
    if (isStale.value) feedback.value = null;
  },
  { flush: 'sync' }
);
const openStandalone = async () => {
  if (isStale.value || !generatedValue.value) return;
  try {
    await chrome.tabs.create({
      url: chrome.runtime.getURL(
        `index.html?type=qrcode&scan=1&url=${encodeURIComponent(generatedValue.value)}`
      ),
    });
  } catch {
    error.value = t('qrcode.openFailed');
  }
};

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
    const url = handleQRCode(value)?.getImgUrl();
    if (!url) throw new Error();
    generatedValue.value = value;
    qrUrl.value = url;
    feedback.value = { message: t('qrcode.messages.generated'), tone: 'success' };
  } catch {
    error.value = t('qrcode.messages.generateFailed');
  }
};

const downloadQr = () => {
  if (!generatedValue.value || isStale.value) return;
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
    if (new URLSearchParams(window.location.search).get('scan') === '1') openScan();
    return;
  }
  getLocalTabUrl((url: string) => {
    originWords.value = url || '';
    if (url) generateQr();
  });
});
</script>

<style scoped>
.qr-tool .converter-tool__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}
.qr-tool .converter-tool__row input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.qr-tool__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.qr-tool .qr-tool__actions button {
  flex: 0 0 auto;
}
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
.qr-tool__enlarge {
  display: grid;
  justify-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  background: #fff;
  cursor: zoom-in;
  font: inherit;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.qr-tool__enlarge:disabled {
  opacity: 0.45;
  cursor: default;
}
.qr-tool__encoded {
  max-width: 100%;
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--color-text-secondary);
  font-size: 12px;
}
.qr-tool__stale {
  margin: 0;
  padding: 8px;
  color: var(--color-warning-foreground);
  background: var(--color-warning-surface);
  border-radius: var(--border-radius-md);
  font-size: 12px;
}
.qr-tool__scan {
  display: grid;
  place-items: center;
  padding: 32px;
  margin: 12px 0;
  background: #fff;
}
.qr-tool__scan img {
  display: block;
  max-width: 100%;
  height: auto;
}
.qr-tool__scan-controls {
  display: flex;
  justify-content: center;
  font-size: 12px;
}
</style>
