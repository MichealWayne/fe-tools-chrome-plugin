<template>
  <section class="converter-tool unit-calculator">
    <p class="unit-calculator__hint">{{ t('unitCalculator.conversionHint') }}</p>
    <div v-for="unit in units" :key="unit" class="converter-field">
      <label :for="`unit-${unit}`">{{ unit }}</label>
      <input
        :id="`unit-${unit}`"
        v-model="values[unit]"
        type="number"
        :aria-invalid="activeSource === unit && Boolean(error)"
        aria-describedby="unit-feedback"
        @input="convert(unit)"
      />
    </div>
    <div class="converter-field">
      <label for="unit-rate">{{ t('unitCalculator.remRatio') }}</label>
      <input id="unit-rate" v-model="rate" type="number" min="0.01" @input="settingsChanged" />
    </div>
    <div class="converter-field">
      <label for="unit-precision">{{ t('unitCalculator.keepDigits') }}</label>
      <input
        id="unit-precision"
        v-model="precision"
        type="number"
        min="0"
        max="10"
        @input="settingsChanged"
      />
    </div>
    <button type="button" @click="reset">{{ t('common.clear') }}</button>
    <inline-feedback
      :feedback="error ? { id: 'unit-feedback', message: error, tone: 'validation' } : null"
    />
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { langManager } from '@/utils/i18n';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';

defineOptions({ name: 'UnitCalculator' });

type Unit = 'px' | 'vw' | 'rem';
const DEFAULT_RATE = 75;
const DEFAULT_PRECISION = 6;
const t = (key: string) => langManager.t(key);
const units: Unit[] = ['px', 'vw', 'rem'];
const values = reactive<Record<Unit, string>>({ px: '', vw: '', rem: '' });
const rate = ref(localStorage.getItem('feTools_rate') || String(DEFAULT_RATE));
const precision = ref(localStorage.getItem('feTools_keep') || String(DEFAULT_PRECISION));
const activeSource = ref<Unit>('px');
const error = ref('');

const validSettings = () => {
  const ratio = Number(rate.value);
  const digits = Number(precision.value);
  if (!Number.isFinite(ratio) || ratio <= 0)
    throw new Error(t('unitCalculator.messages.invalidRate'));
  if (!Number.isInteger(digits) || digits < 0 || digits > 10)
    throw new Error(t('unitCalculator.messages.invalidPrecision'));
  return { ratio, digits };
};

const convert = (source: Unit) => {
  activeSource.value = source;
  error.value = '';
  if (values[source] === '') return;
  try {
    const input = Number(values[source]);
    if (!Number.isFinite(input)) throw new Error(t('unitCalculator.messages.invalidValue'));
    const { ratio, digits } = validSettings();
    const rem = source === 'rem' ? input : source === 'px' ? input / ratio : input / 10;
    if (source !== 'rem') values.rem = rem.toFixed(digits);
    if (source !== 'px') values.px = (rem * ratio).toFixed(digits);
    if (source !== 'vw') values.vw = (rem * 10).toFixed(digits);
  } catch (cause) {
    error.value = (cause as Error).message;
  }
};

const settingsChanged = () => {
  error.value = '';
  try {
    validSettings();
    localStorage.setItem('feTools_rate', rate.value);
    localStorage.setItem('feTools_keep', precision.value);
    if (values[activeSource.value]) convert(activeSource.value);
  } catch (cause) {
    error.value = (cause as Error).message;
  }
};

const reset = () => {
  Object.assign(values, { px: '', vw: '', rem: '' });
  error.value = '';
};
</script>

<style scoped>
.unit-calculator__hint {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.unit-calculator {
  display: grid;
  gap: var(--spacing-sm);
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}

.unit-calculator .converter-field {
  display: grid;
  grid-template-columns: minmax(120px, 0.35fr) minmax(0, 1fr);
  align-items: center;
  gap: var(--spacing-sm);
}

.unit-calculator .converter-field label {
  min-width: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.unit-calculator .converter-field input {
  width: 100%;
  min-height: 36px;
  padding: 8px 10px;
}

.unit-calculator > button {
  justify-self: start;
  min-width: 88px;
  min-height: 36px;
  padding: 8px 16px;
  color: var(--color-text-inverse);
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
}

.unit-calculator > button:hover {
  background: var(--color-primary-dark);
}

@media (max-width: 520px) {
  .unit-calculator .converter-field {
    grid-template-columns: 1fr;
    gap: var(--spacing-xs);
  }
}
</style>
