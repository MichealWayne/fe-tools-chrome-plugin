<template>
  <div class="u-w400" @click.stop="stopPropagation">
    <!-- 实际的上传入口 -->
    <input
      ref="uploadPic"
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
        点击图标或拖拽图片至此处<br />
        <em class="g-fs12">(*.jpg/*.png/*.gif格式)</em>
      </p>
    </div>
    <!-- 上传效果图片展示 -->
    <div v-if="imgUrl" class="f-tc g-pr">
      <em
        :class="$style.close"
        class="u-icon icon-close u-link g-pa"
        title="点击重置图片"
        @click="reset"
      >
        <icon-reset />
      </em>
      <img class="u-w100" style="max-height: 300px" :src="imgUrl" alt="compressed image" />
    </div>

    <!-- 压缩比例调整 -->
    <div class="g-mt20 f-tc">
      <input
        v-model="compressRate"
        class="u-input u-w200 u-p10 g-fs14"
        type="number"
        placeholder="图片压缩比例(0~1, 默认1)"
        min="0"
        max="1"
        @blur="handleRateBlur"
      />
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
import { defineComponent } from 'vue';

import { getCompressedImageBase64, handleInputUploadImageFile } from '@/utils/image';

import IconInbox from './IconInbox.vue';
import IconReset from './IconReset.vue';

export default defineComponent({
  name: 'ImageCompressor',

  components: {
    'icon-inbox': IconInbox,
    'icon-reset': IconReset,
  },

  data() {
    return {
      // 图片压缩比例
      compressRate: '',

      // 页面展示的图片地址
      imgUrl: '',

      // 图片压缩后的base64字符串
      base64result: '',
    };
  },

  mounted() {
    this.setEvents();
  },

  beforeUnmount() {
    this.removeEvents();
  },

  methods: {
    stopPropagation() {
      return false;
    },

    /**
     * base64结果点击选中文案
     */
    textFocus(e: Event) {
      if (!e || !(e.target instanceof HTMLTextAreaElement)) return;
      e.target.select();
    },

    /**
     * 重置状态
     */
    reset() {
      this.imgUrl = '';
      this.base64result = '';
    },

    /**
     * 比例调整输入框失焦时重新压缩
     */
    handleRateBlur() {
      getCompressedImageBase64(this.imgUrl, this.compressRate)
        .then(base64 => (this.base64result = base64))
        .catch(e => {
          console.error(e);
          alert('转换失败，请重试');
        });
    },

    /**
     * 图片文件上传
     */
    handleFileList(fileList?: FileList) {
      handleInputUploadImageFile(fileList, this.compressRate)
        .then(({ imgUrl, base64result }) => {
          this.imgUrl = imgUrl;
          this.base64result = base64result;
        })
        .catch(e => alert(e));
    },

    /**
     * 实际调用的文件上传输入框处理
     */
    _handleInputChange(e: Event) {
      if (!e || !(e.target instanceof HTMLInputElement)) return;

      this.handleFileList(e.target.files!);
    },

    /**
     * 拖拽上传文件
     */
    handleBoxDrag(e: Event) {
      if (!e) return;

      // 取消浏览器默认拖拽效果
      e.preventDefault();

      // 获取拖拽中的文件对象
      const { files } = (e as DragEvent).dataTransfer!;
      this.handleFileList(files);
    },
    handleBoxClick() {
      (this.$refs.uploadPic as HTMLInputElement).click();
    },

    /**
     * 事件设置
     */
    setEvents() {
      const box = document.querySelector('#dragbox');

      // forbid default
      document.addEventListener('drop', function (e) {
        e.preventDefault();
      });

      if (!box) return;

      box.addEventListener('dragover', function (e) {
        console.log('elemenet dragover');
        box?.classList.add('over');
        e.preventDefault();
      });
      box.addEventListener('dragleave', function (e) {
        console.log('elemenet dragleave');
        box?.classList.remove('over');
        e.preventDefault();
      });

      box.addEventListener('drop', this.handleBoxDrag, false);
    },

    /**
     * 事件移除
     */
    removeEvents() {
      const box = document.querySelector('#dragbox');
      if (!box) return;

      box.removeEventListener('drop', this.handleBoxDrag);
    },
  },
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
