<template>
  <div>
    <p class="m-qr_search u-c-middle" @click.stop="handleStop">
      <input v-model="originWords" placeholder="请输入地址" class="u-input" type="text" />
      <button class="u-btn u-w80 g-ml10" s-color="blue" @click.stop="handleUpdate">更新</button>
    </p>
    <img
      class="u-icon u-w200 g-mt20 g-center"
      :src="QRUrl"
      title="右键可保存二维码图片"
      alt="qrcode"
    />
    <p class="f-tc g-fs12 g-mt10">*右键选中图片可保存二维码PNG图片</p>
    <button
      class="u-btn u-w100 u-h40 g-center g-mt10"
      s-color="blue"
      @click.stop="() => handleDownloadQR()"
    >
      下载SVG文件
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

import { getLocalTabUrl } from '@/utils/chrome';
import { handleQRCode } from '@/utils';

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
 * 手动更新
 */
const handleUpdate = () => {
  handleQR();
};

/**
 * 生成二维码
 */
const handleQR = () => {
  const keywords = originWords.value;
  const useInputUrl = keywords?.includes('http');

  if (useInputUrl) {
    // 输入链接
    qrdownloadUrl.value = keywords;
    QRUrl.value = handleQRCode(keywords)!.getImgUrl();
  } else {
    // 当前tab的URL
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
