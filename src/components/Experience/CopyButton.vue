<template>
  <button
    type="button"
    class="tool-button copy-button"
    :disabled="disabled || !value || pending"
    :aria-label="copied ? copiedLabel : failed ? failedLabel : accessibleLabel || label"
    @click="handleCopy"
  >
    <span class="copy-button__labels" aria-hidden="true">
      <span :class="{ 'is-visible': !copied && !failed }">{{ label }}</span>
      <span :class="{ 'is-visible': copied }">{{ copiedLabel }}</span>
      <span :class="{ 'is-visible': failed }">{{ failedLabel }}</span>
    </span>
    <span
      v-if="copied || failed"
      class="visually-hidden"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ copied ? copiedLabel : failed ? failedLabel : '' }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useCopy } from '@/composables/useCopy';
import { langManager } from '@/utils/i18n';

const props = withDefaults(
  defineProps<{ value: string; label: string; accessibleLabel?: string; disabled?: boolean }>(),
  {
    disabled: false,
    accessibleLabel: '',
  }
);
const emit = defineEmits<{ copied: []; error: [] }>();
const { copy, copied, failed, pending, reset } = useCopy();
const localizedLabel = (key: string) => {
  langManager.languageRef.value;
  return langManager.t(key);
};
const copiedLabel = computed(() => localizedLabel('experience.copied'));
const failedLabel = computed(() => localizedLabel('experience.copyFailed'));
watch(() => props.value, reset);

const handleCopy = async () => {
  if (await copy(props.value)) emit('copied');
  else if (failed.value) emit('error');
};
</script>

<style scoped>
.copy-button__labels {
  display: grid;
}
.copy-button__labels > span {
  grid-area: 1 / 1;
  visibility: hidden;
}
.copy-button__labels > .is-visible {
  visibility: visible;
}
</style>
