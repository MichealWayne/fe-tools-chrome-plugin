<template>
  <section class="color-pass" s-bg_white @click.stop="stopPropagation">
    <p :class="$style.title">{{ t('colorPass.title') }}</p>
    <!--颜色输入-->
    <section :class="$style.content">
      <div class="m-color-input">
        <span>{{ t('colorPass.labels.hex') }}：</span>
        <input
          v-model="hex"
          maxlength="6"
          data-type="hex"
          :placeholder="t('colorPass.hexPlaceholder')"
          @keyup="changeColor"
        />
      </div>

      <div class="m-color-input">
        <span>{{ t('colorPass.labels.rgb') }}：</span>
        <input
          v-model="rgb"
          maxlength="11"
          data-type="rgb"
          :placeholder="t('colorPass.rgbPlaceholder')"
          @keyup="changeColor"
        />
      </div>

      <div class="m-color-input">
        <span>{{ t('colorPass.labels.hsb') }}：</span>
        <input
          v-model="hsb"
          maxlength="13"
          data-type="hsb"
          :placeholder="t('colorPass.hsbPlaceholder')"
          @keyup="changeColor"
        />
      </div>

      <div class="m-color-input">
        <span>{{ t('colorPass.labels.hsl') }}：</span>
        <input
          v-model="hsl"
          maxlength="13"
          data-type="hsl"
          :placeholder="t('colorPass.hslPlaceholder')"
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

const t = (key: string) => langManager.t(key);

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
  padding: 6px 0 12px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #1f2a44;
}
.content {
  padding: 6px 20px 12px;
}
</style>

<style lang="less">
.color-pass {
  padding: 18px 20px 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f8ff 100%);
  border: 1px solid #e2e9ff;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(30, 74, 173, 0.12);
}

/**
 * Color input slider section.
 */
.m-color-input {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background-color: #fff;
  border: 1px solid #e4e9f7;
  box-shadow: 0 6px 14px rgba(28, 63, 124, 0.06);

  & > span {
    min-width: 46px;
    font-size: 13px;
    color: #4a5a78;
  }

  & > input {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    border: none;
    background: transparent;
    color: #1f2a44;
    padding: 2px 0;

    &:focus {
      outline: none;
    }

    &::placeholder {
      font-size: 12px;
      color: #9aa6bf;
    }
  }
}

/**
 * Color description and guidance section.
 */
.m-color-intro {
  padding: 12px 20px 4px;
  color: #6b7a99;
  background-color: #f6f8ff;
  border-radius: 10px;
  border: 1px solid #e2e9f7;
  & > p {
    margin-bottom: 6px;
  }
}
</style>
