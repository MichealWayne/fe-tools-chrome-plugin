<template>
  <div>
    <p class="m-qr_search u-c-middle" @click.stop="handleStop">
      <input
        v-model="originWords"
        :placeholder="t('qrcode.inputPlaceholder')"
        class="u-input"
        type="text"
      />
      <button class="u-btn u-w80 g-ml10" s-color="blue" @click.stop="handleUpdate">
        {{ t('qrcode.generate') }}
      </button>
    </p>
    <img
      class="u-icon u-w200 g-mt20 g-center"
      :src="QRUrl"
      :title="t('qrcode.rightClickTip')"
      alt="qrcode"
    />
    <p class="f-tc g-fs12 g-mt10">{{ t('qrcode.saveImageTip') }}</p>
    <button
      class="u-btn u-w100 u-h40 g-center g-mt10"
      s-color="blue"
      @click.stop="() => handleDownloadQR()"
    >
      {{ t('qrcode.downloadSvg') }}
    </button>
  </div>
</template>

<script lang="ts">
export default {
  name: 'QRCode',
};
</script>

<script lang="ts" setup>
import { defineProps, ref, watch, toRefs, onMounted } from 'vue';
import { langManager } from '@/utils/i18n';

import { getLocalTabUrl } from '@/utils/chrome';
import { handleQRCode } from '@/utils';

const t = (key: string) => langManager.t(key);

const props = defineProps({
  keywords: {
    type: String,
    default: '',
  },
});

const { keywords } = toRefs(props);

const originWords = ref('');

const QRUrl = ref('');
const qrdownloadUrl = ref('');

const handleStop = (e: Event) => {
  e.stopPropagation();
};

/**
 * Trigger a manual refresh of the QR code.
 */
const handleUpdate = () => {
  handleQR();
};

/**
 * Generate a QR code from input or the current tab URL.
 */
const handleQR = () => {
  const keywords = originWords.value;
  const useInputUrl = keywords?.includes('http');

  if (useInputUrl) {
    /**
     * Use user-provided URL directly.
     */
    qrdownloadUrl.value = keywords;
    QRUrl.value = handleQRCode(keywords)!.getImgUrl();
  } else {
    /**
     * Fall back to the current tab URL.
     */
    getLocalTabUrl((url: string) => {
      originWords.value = url;
      qrdownloadUrl.value = url;
      QRUrl.value = handleQRCode(url)!.getImgUrl();
    });
  }
};

/**
 * 下载二维码
 */
const handleDownloadQR = (type = 'svg') => {
  handleQRCode(qrdownloadUrl.value)!.downloadQR(type);
};

watch(keywords, (newVal, oldVal) => {
  if (newVal !== oldVal && newVal !== originWords.value) {
    originWords.value = newVal;
  }
});

watch(originWords, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    handleQR();
  }
});

onMounted(() => {
  originWords.value = keywords.value || '';
  handleQR();
});
</script>
