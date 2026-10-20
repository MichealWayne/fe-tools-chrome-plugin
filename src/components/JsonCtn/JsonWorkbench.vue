<template>
  <div class="json-workbench">
    <div class="converter-tool__actions">
      <label class="tool-button"
        >{{ t('jsonWorkbench.import')
        }}<input
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          :disabled="importing"
          @change="importFile"
      /></label>
      <button type="button" class="tool-button" :disabled="!output || importing" @click="download">
        {{ t('jsonWorkbench.download') }}
      </button>
      <button
        v-if="errorPosition"
        type="button"
        class="tool-button"
        @click="$emit('select', errorPosition)"
      >
        {{ t('jsonWorkbench.locateError') }}
      </button>
    </div>
    <div class="json-workbench__search">
      <input
        v-model="query"
        class="tool-input"
        :placeholder="t('jsonWorkbench.search')"
        :aria-label="t('jsonWorkbench.search')"
        @keydown.enter.prevent="selectMatch(1)"
      />
      <select v-model="target" class="tool-input" :aria-label="t('jsonWorkbench.target')">
        <option value="input">{{ t('jsonWorkbench.input') }}</option>
        <option value="output">{{ t('jsonWorkbench.output') }}</option>
      </select>
      <button
        type="button"
        class="tool-button tool-button--small"
        :disabled="!matches.length"
        @click="selectMatch(-1)"
      >
        {{ t('jsonWorkbench.previous') }}
      </button>
      <button
        type="button"
        class="tool-button tool-button--small"
        :disabled="!matches.length"
        @click="selectMatch(1)"
      >
        {{ t('jsonWorkbench.next') }}
      </button>
    </div>
    <p v-if="query" role="status">
      {{
        matches.length >= 10000
          ? t('jsonWorkbench.limit')
          : t('jsonWorkbench.matchCount', {
              current: index < 0 ? 0 : index + 1,
              count: matches.length,
            })
      }}
    </p>
    <p>{{ t('jsonWorkbench.importHint') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { langManager } from '@/utils/i18n';
import { findLiteralMatches, type JsonSelection } from './workbench';
const props = defineProps<{ input: string; output: string; errorPosition?: JsonSelection }>();
const emit = defineEmits<{
  import: [value: string];
  select: [selection: JsonSelection];
  error: [message: string];
}>();
const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);
const query = ref('');
const target = ref<'input' | 'output'>('input');
const index = ref(-1);
const importing = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
let operation = 0;
const matches = computed(() => findLiteralMatches(props[target.value], query.value));
watch([query, target, () => props.input, () => props.output], () => {
  index.value = -1;
});
watch([() => props.input, () => props.output], () => {
  operation++;
  importing.value = false;
});
const selectMatch = (direction: number) => {
  if (!matches.value.length) return;
  index.value =
    index.value < 0
      ? direction > 0
        ? 0
        : matches.value.length - 1
      : (index.value + direction + matches.value.length) % matches.value.length;
  const start = matches.value[index.value];
  emit('select', { target: target.value, start, end: start + query.value.length });
};
const importFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const current = ++operation;
  importing.value = true;
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error();
    const text = await file.text();
    const parsed: unknown = JSON.parse(text.replace(/^\uFEFF/, ''));
    if (current !== operation) return;
    emit('import', JSON.stringify(parsed, null, 2));
  } catch {
    if (current === operation) emit('error', t('jsonWorkbench.importFailed'));
  } finally {
    if (current === operation) importing.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
};
const download = () => {
  try {
    JSON.parse(props.output);
    const url = URL.createObjectURL(new Blob([props.output], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formatted.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    emit('error', t('jsonWorkbench.downloadFailed'));
  }
};
onBeforeUnmount(() => {
  operation++;
});
</script>

<style scoped>
.json-workbench {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
}
.json-workbench input[type='file'] {
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.json-workbench__search {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.json-workbench__search > input {
  flex: 1 1 140px;
  min-width: 0;
}
.json-workbench select {
  font-size: 12px;
}
.json-workbench p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 11px;
}
</style>
