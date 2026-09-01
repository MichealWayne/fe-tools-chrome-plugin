<template>
  <div class="key-value-editor">
    <div class="key-value-editor__head" aria-hidden="true">
      <span></span><span>{{ t('postman.editor.key') }}</span
      ><span>{{ t('postman.editor.value') }}</span
      ><span>{{ t('postman.editor.description') }}</span
      ><span></span>
    </div>
    <div v-for="(entry, index) in entries" :key="entry.id" class="key-value-editor__row">
      <input
        v-model="entry.enabled"
        type="checkbox"
        :aria-label="t('postman.editor.enabled')"
        @change="update"
      />
      <input v-model="entry.key" :placeholder="keyPlaceholder" @input="update" />
      <div class="key-value-editor__value">
        <input
          v-model="entry.value"
          :type="entry.secret && !visibleSecrets.has(entry.id || '') ? 'password' : 'text'"
          :placeholder="valuePlaceholder"
          @input="update"
        />
        <button
          v-if="allowSecret && entry.secret"
          type="button"
          class="icon-btn"
          :aria-label="t('postman.editor.toggleSecret')"
          @click="toggleSecret(entry.id || '')"
        >
          <i :class="['fas', visibleSecrets.has(entry.id || '') ? 'fa-eye-slash' : 'fa-eye']"></i>
        </button>
      </div>
      <input
        v-model="entry.description"
        :placeholder="t('postman.editor.description')"
        @input="update"
      />
      <div class="key-value-editor__actions">
        <label v-if="allowSecret" :title="t('postman.editor.secret')">
          <input v-model="entry.secret" type="checkbox" @change="update" />
          <i class="fas fa-lock" aria-hidden="true"></i>
          <span class="z-hide">{{ t('postman.editor.secret') }}</span>
        </label>
        <button
          type="button"
          class="icon-btn danger"
          :aria-label="t('postman.actions.remove')"
          @click="remove(index)"
        >
          <i class="fas fa-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>
    <button type="button" class="add-row-btn" @click="add">
      <i class="fas fa-plus" aria-hidden="true"></i> {{ t('postman.actions.addField') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { langManager } from '@/utils/i18n';
import type { EnvironmentVariable, KeyValueEntry } from './types';
import { createEntryId, normalizeEntries } from './utils/request-model';

type EditorEntry = KeyValueEntry & Pick<EnvironmentVariable, 'secret'>;

const props = withDefaults(
  defineProps<{
    modelValue: EditorEntry[];
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    allowSecret?: boolean;
  }>(),
  { keyPlaceholder: 'Key', valuePlaceholder: 'Value', allowSecret: false }
);
const emit = defineEmits<{ 'update:modelValue': [entries: EditorEntry[]] }>();
const t = (key: string) => langManager.t(key);
const entries = ref<EditorEntry[]>(normalizeEntries(props.modelValue));
const visibleSecrets = ref(new Set<string>());

watch(
  () => props.modelValue,
  value => {
    entries.value = normalizeEntries(value);
  },
  { deep: true }
);

const update = () =>
  emit(
    'update:modelValue',
    entries.value.map(entry => ({ ...entry }))
  );
const add = () => {
  entries.value.push({ id: createEntryId(), enabled: true, key: '', value: '', description: '' });
  update();
};
const remove = (index: number) => {
  entries.value.splice(index, 1);
  update();
};
const toggleSecret = (id: string) => {
  const next = new Set(visibleSecrets.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  visibleSecrets.value = next;
};
</script>

<style scoped>
.key-value-editor__head,
.key-value-editor__row {
  display: grid;
  grid-template-columns: 24px minmax(100px, 1fr) minmax(120px, 1.3fr) minmax(100px, 1fr) auto;
  gap: var(--spacing-sm);
  align-items: center;
}
.key-value-editor__head {
  padding: 0 var(--spacing-xs) var(--spacing-xs);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.key-value-editor__row {
  margin-bottom: var(--spacing-sm);
}
.key-value-editor input:not([type='checkbox']) {
  width: 100%;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-background-light);
}
.key-value-editor input:focus {
  outline: none;
  border-color: var(--color-primary);
}
.key-value-editor__value {
  display: flex;
  min-width: 0;
}
.key-value-editor__value input {
  flex: 1;
}
.key-value-editor__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.icon-btn {
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 7px;
}
.icon-btn.danger:hover {
  color: var(--color-error);
}
.add-row-btn {
  border: 1px dashed var(--color-border);
  background: transparent;
  color: var(--color-primary);
  padding: 7px 12px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
}
@media (max-width: 760px) {
  .key-value-editor__head {
    display: none;
  }
  .key-value-editor__row {
    grid-template-columns: 24px 1fr auto;
  }
  .key-value-editor__row > input:not([type='checkbox']),
  .key-value-editor__value {
    grid-column: 2;
  }
  .key-value-editor__actions {
    grid-column: 3;
    grid-row: 1;
  }
}
</style>
