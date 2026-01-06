<template>
  <div class="u-w400" @click.stop="stopPropagation">
    <!-- 实际的上传入口 -->
    <input
      ref="uploadPicElem"
      class="z-hide"
      type="file"
      accept="image/*"
      name="image"
      @change="_handleInputChange"
    />

    <div
      v-show="!imgUrl"
      id="dragbox"
      class="u-link f-tc g-center"
      :class="$style.box"
      s-bg_white
      @click.stop="handleBoxClick"
    >
      <!-- 文件上传交互入口，点击/拖拽文件上传 -->
      <icon-inbox />
      <p class="g-fs14" s-ft_sub>
        {{ t('imageCompressor.dragTip') }}<br />
        <em class="g-fs12">{{ t('imageCompressor.formatTip') }}</em>
      </p>
    </div>
    <!-- 上传效果图片展示 -->
    <div v-if="imgUrl" class="f-tc g-pr">
      <em
        :class="$style.close"
        class="u-icon u-icon-close u-link g-pa"
        :title="t('imageCompressor.resetTip')"
        @click="reset"
      >
        <icon-reset />
      </em>
      <img class="u-w100" style="max-height: 300px" :src="imgUrl" alt="compressed image" />
    </div>

    <!-- 压缩比例调整 -->
    <div class="g-mt20 f-tc">
      <input
        v-model.number="compressRate"
        class="u-input u-w200 u-p10 g-fs14"
        type="number"
        :placeholder="t('imageCompressor.compressRatio')"
        min="0"
        max="1"
        @blur="handleRateBlur"
      />
      <button class="u-btn_il g-ml10" s-color="blue" @click="handleCompressConfirm">
        {{ t('common.confirm') }}
      </button>
    </div>

    <!-- base64压缩结果 -->
    <div v-show="base64result" class="g-mt20">
      <textarea
        v-model="base64result"
        class="u-block u-h60 u-p10 g-fs12 u-w92per g-center"
        @click="textFocus"
      ></textarea>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ImageCompressor',
};
</script>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { langManager } from '@/utils/i18n';

import { getFileBase64 } from '@/utils';
import { getCompressedImageBase64, handleInputUploadImageFile } from '@/utils/image';

import IconInbox from './IconInbox.vue';
import IconReset from './IconReset.vue';

const t = (key: string) => langManager.t(key);

/**
 * Compression ratio selected by the user.
 */
const compressRate = ref<number>();

/**
 * Preview image URL used by the UI.
 */
const imgUrl = ref('');

/**
 * Compressed image Base64 output.
 */
const base64result = ref('');
const originalBase64 = ref('');

/**
 * Input element reference for file uploads.
 */
const uploadPicElem = ref<any>(null);

const stopPropagation = () => false;

/**
 * Select the Base64 output when the textarea is clicked.
 * @param e - Click event from the textarea.
 */
const textFocus = (e: Event) => {
  if (!e || !(e.target instanceof HTMLTextAreaElement)) return;
  e.target.select();
};

/**
 * Clear the current image state and outputs.
 */
const reset = () => {
  imgUrl.value = '';
  base64result.value = '';
  originalBase64.value = '';
};

/**
 * Re-compress the image when compression input loses focus.
 */
const handleCompressConfirm = () => {
  if (!imgUrl.value) return;
  const rateNum = Number(compressRate.value);
  if (!Number.isFinite(rateNum) || rateNum <= 0 || rateNum > 1) {
    base64result.value = originalBase64.value;
    return;
  }

  getCompressedImageBase64(imgUrl.value, rateNum)
    .then(base64 => {
      base64result.value = base64;
    })
    .catch(e => {
      console.error(e);
      alert(t('imageCompressor.messages.convertFailed'));
    });
};

const handleRateBlur = () => {
  handleCompressConfirm();
};

/**
 * Handle FileList uploads and compute preview/base64 outputs.
 * @param fileList - FileList from input or drag-drop.
 */
const handleFileList = (fileList?: FileList) => {
  const file = fileList?.[0];
  if (file) {
    getFileBase64(file, (base64: string) => {
      originalBase64.value = base64;
      const rateNum = Number(compressRate.value);
      if (!Number.isFinite(rateNum) || rateNum <= 0 || rateNum > 1) {
        base64result.value = base64;
      }
    });
  }

  handleInputUploadImageFile(fileList, compressRate.value)
    .then(({ imgUrl: newImgUrl, base64result: newBase64result }) => {
      imgUrl.value = newImgUrl;
      base64result.value = newBase64result;
    })
    .catch(e => alert(e));
};

/**
 * Handle the actual file input change event.
 * @param e - Change event from the file input.
 */
const _handleInputChange = (e: Event) => {
  if (!e || !(e.target instanceof HTMLInputElement)) return;

  handleFileList(e.target.files!);
};

/**
 * Handle drag-and-drop uploads on the drop zone.
 * @param e - Drag event with transfer data.
 */
const handleBoxDrag = (e: Event) => {
  if (!e) return;

  /**
   * Prevent browser default drag-drop behavior.
   */
  e.preventDefault();

  /**
   * Extract files from the drag event.
   */
  const { files } = (e as DragEvent).dataTransfer!;
  handleFileList(files);
};
const handleBoxClick = () => {
  (uploadPicElem.value as HTMLInputElement).click();
};

const setEvents = () => {
  const box = document.querySelector('#dragbox');

  /**
   * Prevent the browser from opening dropped files.
   */
  document.addEventListener('drop', e => {
    e.preventDefault();
  });

  if (!box) return;

  box.addEventListener('dragover', e => {
    box?.classList.add('over');
    e.preventDefault();
  });
  box.addEventListener('dragleave', e => {
    box?.classList.remove('over');
    e.preventDefault();
  });

  box.addEventListener('drop', handleBoxDrag, false);
};
const removeEvents = () => {
  const box = document.querySelector('#dragbox');
  if (!box) return;

  box.removeEventListener('drop', handleBoxDrag);
};

onMounted(() => {
  setEvents();
});

onBeforeUnmount(() => {
  removeEvents();
});
</script>

<style lang="less" module>
.box {
  position: relative;
  padding: 40px 15px;
  width: 300px;
  border-radius: 4px;
}
.close {
  right: 0;
  top: 0;
  width: 30px;
  height: 30px;
  line-height: 30px;
  border-radius: 50%;
  background-color: #e2e2e2;
}
</style>
