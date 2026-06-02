<template>
  <section class="unit-calculator" s-bg_white @click.stop="stopPropagation">
    <div class="u-w500">
      <h4 class="unit-calculator__title">{{ t('unitCalculator.title') }}</h4>
      <section class="unit-calculator__content u-p20">
        <div class="m-color-input">
          <span class="g-fs14">px：</span>
          <input
            v-model="px"
            maxlength="4"
            data-type="px"
            :placeholder="t('unitCalculator.pxPlaceholder')"
            @keyup="changeValue"
          />
        </div>

        <div class="m-color-input">
          <span class="g-fs14">vw：</span>
          <input
            v-model="vw"
            maxlength="4"
            data-type="vw"
            :placeholder="t('unitCalculator.vwPlaceholder')"
            @keyup="changeValue"
          />
        </div>

        <div class="m-color-input">
          <span class="g-fs14">rem：</span>
          <input
            v-model="rem"
            maxlength="4"
            data-type="rem"
            :placeholder="t('unitCalculator.remPlaceholder')"
            @keyup="changeValue"
          />
        </div>

        <div class="m-color-input u-l-middle">
          <span class="g-fs14">{{ t('unitCalculator.remRatio') }}：</span>
          <input
            v-model="defaultRate"
            maxlength="4"
            data-type="rgb"
            :placeholder="t('unitCalculator.remRatioPlaceholder')"
            @keyup="changeValue"
          />
          <span class="g-fs14">{{ t('unitCalculator.keepDigits') }}：</span>
          <input
            v-model="defaultKeep"
            maxlength="4"
            data-type="rgb"
            :placeholder="t('unitCalculator.keepDigitsPlaceholder')"
            @keyup="changeValue"
          />
        </div>
      </section>
    </div>
  </section>
</template>

<script lang="ts">
export default {
  name: 'UnitCalculator',
};
</script>

<script lang="ts" setup>
import { ref } from 'vue';
import { langManager } from '@/utils/i18n';

const t = (key: string) => langManager.t(key);

const DEFAULT_REM_RATE = 75;
const DEFAULT_FIXED_NUMBER = 6;

/**
 * Default rem conversion ratio from localStorage or fallback.
 */
const defaultRate = ref(parseFloat(localStorage.getItem('feTools_rate') || '') || DEFAULT_REM_RATE);
/**
 * Default decimal precision for conversion outputs.
 */
const defaultKeep = ref(
  parseInt(localStorage.getItem('feTools_keep') || '', 10) || DEFAULT_FIXED_NUMBER
);

const px = ref('');
const vw = ref('');
const rem = ref('');

const stopPropagation = () => false;

/**
 * 监听单位值改变
 */
const changeValue = (e: Event) => {
  if (!e || !(e.target instanceof HTMLElement)) return;

  const { type } = e.target!.dataset;
  const rate = defaultRate.value;
  const keep = defaultKeep.value;

  if (!rate || Number.isNaN(rate) || Number.isNaN(keep)) return;

  const SizeUnit = 10;
  switch (type) {
    case 'px':
      rem.value = (parseFloat(px.value) / rate).toFixed(keep);
      vw.value = (parseFloat(rem.value) * SizeUnit).toFixed(keep);
      break;
    case 'vw':
      rem.value = (parseFloat(vw.value) / SizeUnit).toFixed(keep);
      px.value = (parseFloat(rem.value) * rate).toFixed(keep);
      break;
    case 'rem':
      px.value = (parseFloat(rem.value) * rate).toFixed(keep);
      vw.value = (parseFloat(rem.value) * SizeUnit).toFixed(keep);
      break;
    default:
      console.error(`[Warning]illegal type:${type}(UnitCalculator)`);
  }
};
</script>

<style lang="less">
.unit-calculator {
  padding: 18px 20px 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f8ff 100%);
  border: 1px solid #e2e9ff;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(30, 74, 173, 0.12);

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2a44;
  }

  &__content {
    padding-top: 12px;
  }
}
</style>
