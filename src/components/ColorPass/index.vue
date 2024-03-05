<template>
  <section s-bg_white @click.stop="stopPropagation">
    <p :class="$style.title">颜色表示方式转化</p>
    <!--颜色输入-->
    <section :class="$style.content">
      <div class="m-color-input">
        <span>HEX：</span>
        <input
          v-model="hex"
          maxlength="6"
          data-type="hex"
          placeholder="16进制表示，如ff0000"
          @keyup="changeColor"
        />
      </div>

      <div class="m-color-input">
        <span>RGB：</span>
        <input
          v-model="rgb"
          maxlength="11"
          data-type="rgb"
          placeholder="RGB表示，逗号分隔，如255,0,0"
          @keyup="changeColor"
        />
      </div>

      <div class="m-color-input">
        <span>HSB：</span>
        <input
          v-model="hsb"
          maxlength="13"
          data-type="hsb"
          placeholder="HSB表示，逗号分隔，如0,100%,100%"
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
export default {
  name: 'ColorPass',
};
</script>

<script lang="ts" setup>
import { ref } from 'vue';

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

const hex = ref('');
const rgb = ref('');
const hsb = ref('');

const stopPropagation = () => false;

const changeColor = (e: Event) => {
  if (!e || !(e.target instanceof HTMLElement)) return;
  const { type } = e.target.dataset;

  const setEmptyOutput = () => {
    hsb.value = rgb.value = '';
  };

  switch (type) {
    case 'hex':
      checkHex(
        hex.value,
        () => {
          const divisionNum = 2;
          rgb.value = hexToRgb(divisionString(hex.value, divisionNum)).join(',');
          const rgbArr = rgb.value.split(',');
          hsb.value = rgbToHsb(rgbArr).join(',');
        },
        setEmptyOutput
      );
      break;
    case 'rgb':
      checkRgb(
        rgb.value,
        () => {
          const rgbArr = rgb.value.split(',');
          hex.value = rgbToHex(rgbArr).join('');
          hsb.value = rgbToHsb(rgbArr).join(',');
        },
        setEmptyOutput
      );
      break;
    case 'hsb':
      checkHsb(
        hsb.value,
        () => {
          rgb.value = hsbToRgb(hsb.value.split(',').map(val => parseInt(val, 10))).join(',');
          const rgbArr = rgb.value.split(',');
          hex.value = rgbToHex(rgbArr).join('');
        },
        setEmptyOutput
      );
      break;
    default:
      console.error(`[Warning]illegal type:${type}(ColorPass)`);
  }
};
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
    width: 300px;
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
