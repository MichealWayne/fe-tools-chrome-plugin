<template>
  <section s-bg_white @click.stop="stopPropagation">
    <div class="u-w500">
      <h4>rem/vw/px换算</h4>
      <section class="u-p20">
        <div class="m-color-input">
          <span class="g-fs14">px：</span>
          <input
            v-model="px"
            maxlength="4"
            data-type="px"
            placeholder="px单位"
            @keyup="changeValue"
          />
        </div>

        <div class="m-color-input">
          <span class="g-fs14">vw：</span>
          <input
            v-model="vw"
            maxlength="4"
            data-type="vw"
            placeholder="vw单位,1rem=10vw"
            @keyup="changeValue"
          />
        </div>

        <div class="m-color-input">
          <span class="g-fs14">rem：</span>
          <input
            v-model="rem"
            maxlength="4"
            data-type="rem"
            placeholder="rem单位"
            @keyup="changeValue"
          />
        </div>

        <div class="m-color-input u-l-middle">
          <span class="g-fs14">rem比例：</span>
          <input
            v-model="defaultRate"
            maxlength="4"
            data-type="rgb"
            placeholder="rem转换比例,默认1rem=75px"
            @keyup="changeValue"
          />
          <span class="g-fs14">保留位数：</span>
          <input
            v-model="defaultKeep"
            maxlength="4"
            data-type="rgb"
            placeholder="保留位数,默认保留6位小数"
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

const DEFAULT_REM_RATE = 75;
const DEFAULT_FIXED_NUMBER = 6;

// 默认rem转换比例
const defaultRate = ref(parseFloat(localStorage.getItem('feTools_rate') || '') || DEFAULT_REM_RATE);
// 默认保留位数
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
