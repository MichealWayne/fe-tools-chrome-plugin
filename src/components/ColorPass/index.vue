<template>
  <section class="converter-tool color-pass">
    <div v-for="field in fields" :key="field.key" class="converter-field">
      <label :for="`color-${field.key}`">{{ field.label }}</label>
      <input
        :id="`color-${field.key}`"
        v-model="values[field.key]"
        :placeholder="field.placeholder"
        :aria-invalid="activeSource === field.key && Boolean(error)"
        aria-describedby="color-feedback"
        @input="convert(field.key)"
      />
      <button
        class="u-btn"
        type="button"
        :disabled="!values[field.key]"
        @click="copy(values[field.key])"
      >
        {{ t('common.copy') }}
      </button>
    </div>
    <div class="converter-tool__actions">
      <button class="u-btn" type="button" @click="reset">{{ t('common.clear') }}</button>
    </div>
    <inline-feedback
      :feedback="error ? { id: 'color-feedback', message: error, tone: 'validation' } : feedback"
    />
    <div
      class="m-color-show"
      :style="{ backgroundColor: values.hex ? `#${values.hex}` : '#fff' }"
    ></div>
    <remark-infos />
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { langManager } from '@/utils/i18n';
import RemarkInfos from './RemarkInfos.vue';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import type { InlineFeedbackMessage } from '@/types/experience';
import {
  hsbToRgb,
  rgbToHex,
  rgbToHsb,
  hexToRgb,
  divisionString,
  rgbToHsl,
  hslToRgb,
} from '@/utils/color';

defineOptions({ name: 'ColorPass' });

type ColorKey = 'hex' | 'rgb' | 'hsb' | 'hsl';
const t = (key: string) => langManager.t(key);
const values = reactive<Record<ColorKey, string>>({ hex: '', rgb: '', hsb: '', hsl: '' });
const activeSource = ref<ColorKey>('hex');
const error = ref('');
const feedback = ref<InlineFeedbackMessage | null>(null);
const fields = computed(() => [
  { key: 'hex' as const, label: 'HEX', placeholder: t('colorPass.hexPlaceholder') },
  { key: 'rgb' as const, label: 'RGB', placeholder: t('colorPass.rgbPlaceholder') },
  { key: 'hsb' as const, label: 'HSB', placeholder: t('colorPass.hsbPlaceholder') },
  { key: 'hsl' as const, label: 'HSL', placeholder: t('colorPass.hslPlaceholder') },
]);

const parseTriplet = (value: string, firstMax: number) => {
  const parts = value.split(',').map(part => Number(part.replace('%', '').trim()));
  return parts.length === 3 &&
    parts.every(Number.isFinite) &&
    parts[0] >= 0 &&
    parts[0] <= firstMax &&
    parts[1] >= 0 &&
    parts[1] <= 100 &&
    parts[2] >= 0 &&
    parts[2] <= 100
    ? parts
    : null;
};

const convert = (source: ColorKey) => {
  activeSource.value = source;
  error.value = '';
  feedback.value = null;
  const value = values[source].trim();
  if (!value) return;
  try {
    let rgb: string[];
    if (source === 'hex') {
      if (!/^[\da-f]{6}$/i.test(value)) throw new Error(t('colorPass.messages.invalidHex'));
      rgb = hexToRgb(divisionString(value, 2)).map(String);
    } else if (source === 'rgb') {
      const parts = value.split(',').map(part => Number(part.trim()));
      if (
        parts.length !== 3 ||
        parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)
      )
        throw new Error(t('colorPass.messages.invalidRgb'));
      rgb = parts.map(String);
    } else if (source === 'hsb') {
      const parts = parseTriplet(value, 360);
      if (!parts) throw new Error(t('colorPass.messages.invalidHsb'));
      rgb = hsbToRgb(parts).map(String);
    } else {
      const parts = parseTriplet(value, 360);
      if (!parts) throw new Error(t('colorPass.messages.invalidHsl'));
      rgb = hslToRgb([String(parts[0]), `${parts[1]}%`, `${parts[2]}%`]).map(String);
    }
    if (source !== 'rgb') values.rgb = rgb.join(',');
    if (source !== 'hex') values.hex = rgbToHex(rgb).join('');
    if (source !== 'hsb') values.hsb = rgbToHsb(rgb).join(',');
    if (source !== 'hsl') values.hsl = rgbToHsl(rgb).join(',');
  } catch (cause) {
    error.value = (cause as Error).message;
  }
};

const copy = async (value: string) => {
  await navigator.clipboard.writeText(value);
  feedback.value = { message: t('experience.copied'), tone: 'success' };
};
const reset = () => {
  Object.assign(values, { hex: '', rgb: '', hsb: '', hsl: '' });
  error.value = '';
  feedback.value = null;
};
</script>

<style scoped>
.color-pass {
  padding: 4px;
}
.m-color-show {
  height: 70px;
  margin-top: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}
</style>
