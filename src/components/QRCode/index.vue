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
    <button
      class="u-btn u-w100 u-h40 g-center g-mt20"
      s-color="blue"
      @click.stop="handleDownloadQR"
    >
      下载SVG文件
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { getLocalTabUrl } from '@/utils/chrome';
import { handleQRCode } from '@/utils';

export default defineComponent({
  name: 'QRCode',

  props: {
    keywords: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      originWords: '',

      QRUrl: '',
      qrdownloadUrl: '',
    };
  },

  watch: {
    keywords(newVal) {
      if (newVal) {
        this.originWords = newVal;
      }
    },
    originWords(newVal, oldVal) {
      if (newVal && newVal !== oldVal) {
        this.handleQR();
      }
    },
  },

  mounted() {
    this.originWords = this.keywords || '';
    this.handleQR();
  },

  methods: {
    handleStop(e: Event) {
      e.stopPropagation();
    },

    /**
     * 手动更新
     */
    handleUpdate() {
      this.handleQR();
    },

    /**
     * 生成二维码
     */
    handleQR() {
      const keywords = this.originWords;
      const useInputUrl = keywords?.includes('http');

      if (useInputUrl) {
        this.qrdownloadUrl = keywords;
        this.QRUrl = handleQRCode(keywords)!.getImgUrl();
      } else {
        // 当前tab的URL
        getLocalTabUrl((url: string) => {
          this.originWords = url;
          this.qrdownloadUrl = url;
          this.QRUrl = handleQRCode(url)!.getImgUrl();
        });
      }
    },

    /**
     * 下载二维码
     */
    handleDownloadQR() {
      handleQRCode(this.qrdownloadUrl)!.downloadQR();
    },
  },
});
</script>
