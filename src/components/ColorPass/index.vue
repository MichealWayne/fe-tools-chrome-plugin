<template>
  <section s-bg_white @click.stop="stopPropagation">
    <p :class="$style.title">颜色表示方式转化</p>
    <!--颜色输入-->
    <section :class="$style.content">
      <div class="m-color-input">
        <span>RGB：</span>
        <input
          v-model="rgb"
          maxlength="11"
          data-type="rgb"
          placeholder="RGB表示，逗号分隔"
          @keyup="changeColor"
        />
      </div>

      <div class="m-color-input">
        <span>HEX：</span>
        <input
          v-model="hex"
          maxlength="6"
          data-type="hex"
          placeholder="16进制表示"
          @keyup="changeColor"
        />
      </div>

      <div class="m-color-input">
        <span>HSB：</span>
        <input
          v-model="hsb"
          maxlength="13"
          data-type="hsb"
          placeholder="HSB表示，逗号分隔"
          @keyup="changeColor"
        />
      </div>
    </section>
    <!--颜色展示-->
    <div class="m-color-show" :style="{ backgroundColor: `#${hex || 'fff'}` }"></div>

    <!--备注-->
    <remark-infos />
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import RemarkInfos from './RemarkInfos.vue';

import {
  hsbToRgb,
  rgbToHex,
  rgbToHsb,
  hexToRgb,
  divisionString,
  checkHex,
  checkRgb,
  checkHsb,
} from '@/utils/color';

export default defineComponent({
  name: 'ColorPass',

  components: {
    'remark-infos': RemarkInfos,
  },

  data() {
    return {
      hex: '',
      rgb: '',
      hsb: '',
    };
  },
  methods: {
    stopPropagation() {
      return false;
    },
    changeColor(e: Event) {
      if (!e || !(e.target instanceof HTMLElement)) return;
      let type = e.target.dataset.type;

      const setEmptyOutput = () => (this.hsb = this.rgb = '');

      switch (type) {
        case 'hex':
          checkHex(
            this.hex,
            () => {
              this.rgb = hexToRgb(divisionString(this.hex, 2)).join(',');
              let rgbArr = this.rgb.split(',');
              this.hsb = rgbToHsb(rgbArr).join(',');
            },
            setEmptyOutput
          );
          break;
        case 'rgb':
          checkRgb(
            this.rgb,
            () => {
              let rgbArr = this.rgb.split(',');
              this.hex = rgbToHex(rgbArr).join('');
              this.hsb = rgbToHsb(rgbArr).join(',');
            },
            setEmptyOutput
          );
          break;
        case 'hsb':
          checkHsb(
            this.hsb,
            () => {
              this.rgb = hsbToRgb(this.hsb.split(',').map(val => parseInt(val))).join(',');
              let rgbArr = this.rgb.split(',');
              this.hex = rgbToHex(rgbArr).join('');
            },
            setEmptyOutput
          );
      }
    },
  },
});
</script>

<style lang="less" module>
.title {
  padding: 10px 0;
  text-align: center;
  font-size: 18px;
}
.content {
  padding: 10px 20px;
}
</style>

<style lang="less">
// 颜色输入条
.m-color-input {
  margin-bottom: 10px;

  & > input {
    font-size: 18px;
    border-bottom: 1px solid #888;
    &::placeholder {
      font-size: 14px;
      color: #999;
    }
  }
}

// 颜色介绍部分
.m-color-intro {
  padding: 10px 20px;
  & > p {
    margin-bottom: 5px;
  }
}
</style>
