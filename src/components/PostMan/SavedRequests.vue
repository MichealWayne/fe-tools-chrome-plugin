<template>
  <div class="secondary-tool">
    <h3>{{ t('postman.saved.title') }}</h3>
    <form class="save-form" @submit.prevent="submitSave">
      <input v-model="name" :placeholder="t('postman.saved.namePlaceholder')" />
      <button type="submit">{{ t('postman.saved.saveCurrent') }}</button>
    </form>
    <div v-if="pendingReplace" class="postman-confirm" role="alertdialog">
      <span>{{ t('postman.saved.replaceConfirm', { name: pendingReplace }) }}</span>
      <button type="button" @click="save(true)">{{ t('experience.confirm') }}</button>
      <button type="button" @click="pendingReplace = ''">{{ t('experience.cancel') }}</button>
    </div>
    <p v-if="!items.length" class="empty">{{ t('postman.saved.empty') }}</p>
    <div v-for="item in items" :key="item.id" class="saved-row">
      <button class="saved-load" type="button" @click="$emit('load', item)">
        <strong>{{ item.name }}</strong
        ><span>{{ item.request.method }} · {{ item.request.url }}</span>
      </button>
      <button type="button" :aria-label="t('common.edit')" @click="rename(item)">
        <i class="fas fa-pen"></i>
      </button>
      <button type="button" :aria-label="t('common.delete')" @click="remove(item.id)">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { langManager } from '@/utils/i18n';
import type { PostmanRequestConfig, SavedRequest } from './types';
import { redactRequest } from './utils/redaction';

const props = defineProps<{ items: SavedRequest[]; request: PostmanRequestConfig }>();
const emit = defineEmits<{
  'update:items': [items: SavedRequest[]];
  load: [item: SavedRequest];
  feedback: [message: string, tone: 'success' | 'error'];
}>();
const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);
const name = ref('');
const pendingReplace = ref('');
const editingId = ref('');
const submitSave = () => save(false);

const save = (replace = false) => {
  const trimmed = name.value.trim();
  if (!trimmed) return;
  const nameCollision = props.items.find(
    item => item.name === trimmed && item.id !== editingId.value
  );
  const editing = props.items.find(item => item.id === editingId.value);
  if (nameCollision && !replace) {
    pendingReplace.value = trimmed;
    return;
  }
  const existing = replace ? nameCollision : editing;
  const safe = redactRequest(props.request);
  const now = Date.now();
  const item: SavedRequest = {
    id: existing?.id || `saved-${now}`,
    name: trimmed,
    request: safe.request,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    redacted: safe.redacted,
  };
  emit(
    'update:items',
    existing
      ? props.items.map(value => (value.id === existing.id ? item : value))
      : [item, ...props.items]
  );
  emit(
    'feedback',
    safe.redacted ? t('postman.feedback.requestSavedRedacted') : t('postman.feedback.requestSaved'),
    'success'
  );
  name.value = '';
  editingId.value = '';
  pendingReplace.value = '';
};
const remove = (id: string) =>
  emit(
    'update:items',
    props.items.filter(item => item.id !== id)
  );
const rename = (item: SavedRequest) => {
  name.value = item.name;
  editingId.value = item.id;
};
</script>

<style scoped>
.secondary-tool {
  padding: var(--spacing-md);
}
.secondary-tool h3 {
  margin-top: 0;
}
.save-form {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
.save-form input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
}
.save-form button {
  border: 0;
  border-radius: var(--border-radius-sm);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  padding: 8px 12px;
}
.saved-row {
  display: flex;
  align-items: center;
  border-top: 1px solid var(--color-border-light);
}
.saved-row > button {
  border: 0;
  background: transparent;
  padding: 10px;
  cursor: pointer;
}
.saved-load {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}
.saved-load span {
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.empty {
  color: var(--color-text-tertiary);
}
</style>
