<template>
  <section s-bg_white @click.stop="stopPropagation">
    <p :class="$style.title">{{ t('colorpass.title') }}</p>
    <!--颜色输入-->
    <section :class="$style.content">
      <div class="m-color-input">
        <span>HEX：</span>
        <input
          v-model="hex"
          maxlength="6"
          data-type="hex"
          :placeholder="t('colorpass.hexPlaceholder')"
          @keyup="changeColor"
        />
      </div>

      <div class="m-color-input">
        <span>RGB：</span>
        <input
          v-model="rgb"
          maxlength="11"
          data-type="rgb"
          :placeholder="t('colorpass.rgbPlaceholder')"
          @keyup="changeColor"
        />
      </div>

      <div class="m-color-input">
        <span>HSB：</span>
        <input
          v-model="hsb"
          maxlength="13"
          data-type="hsb"
          :placeholder="t('colorpass.hsbPlaceholder')"
          @keyup="changeColor"
        />
      </div>

      <div class="m-color-input">
        <span>HSL：</span>
        <input
          v-model="hsl"
          maxlength="13"
          data-type="hsl"
          :placeholder="t('colorpass.hslPlaceholder')"
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
import { langManager } from '@/utils/i18n';

import RemarkInfos from './RemarkInfos.vue';

const t = (key: string) => langManager.t(key);

import {
  hsbToRgb,
  rgbToHex,
  rgbToHsb,
  hexToRgb,
  divisionString,
  checkHex,
  checkRgb,
  checkHsb,
  rgbToHsl,
  hslToRgb,
  checkHsl,
} from '@/utils/color';

const hex = ref('');
const rgb = ref('');
const hsb = ref('');
const hsl = ref('');

const stopPropagation = () => false;

const changeColor = (e: Event) => {
  if (!e || !(e.target instanceof HTMLElement)) return;
  const { type } = e.target.dataset;

  const setEmptyOutput = () => {
    hsb.value = rgb.value = hsl.value = '';
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
          hsl.value = rgbToHsl(rgbArr).join(',');
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
          hsl.value = rgbToHsl(rgbArr).join(',');
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
          hsl.value = rgbToHsl(rgbArr).join(',');
        },
        setEmptyOutput
      );
      break;
    case 'hsl':
      checkHsl(
        hsl.value,
        () => {
          const hslArr = hsl.value.split(',');
          rgb.value = hslToRgb(hslArr).join(',');
          const rgbArr = rgb.value.split(',');
          hex.value = rgbToHex(rgbArr).join('');
          hsb.value = rgbToHsb(rgbArr).join(',');
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
