<template>
  <div class="request-headers">
    <div class="section-header">
      <h3>{{ t('postman.headers.title') }}</h3>
      <button class="add-btn" @click="addHeader">
        <i class="fas fa-plus"></i> {{ t('postman.headers.add') }}
      </button>
    </div>

    <div class="headers-list">
      <div v-for="(header, index) in headers" :key="index" class="header-item">
        <input
          v-model="header.key"
          :placeholder="t('postman.headers.headerKey')"
          class="header-input"
          @input="updateHeaders"
        />
        <input
          v-model="header.value"
          :placeholder="t('postman.headers.headerValue')"
          class="header-input"
          @input="updateHeaders"
        />
        <button
          class="remove-btn"
          :aria-label="t('postman.actions.remove')"
          :title="t('postman.actions.remove')"
          @click="removeHeader(index)"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'RequestHeaders',
};
</script>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { langManager } from '@/utils/i18n';
import type { HeaderEntry } from './types';

const t = (key: string) => langManager.t(key);

const props = defineProps<{
  modelValue: HeaderEntry[];
}>();

const emit = defineEmits<{
  'update:modelValue': [headers: HeaderEntry[]];
}>();

const headers = ref<HeaderEntry[]>([...props.modelValue]);

watch(
  () => props.modelValue,
  newHeaders => {
    headers.value = [...newHeaders];
  },
  { deep: true }
);

const addHeader = () => {
  headers.value.push({ key: '', value: '' });
  updateHeaders();
};

const removeHeader = (index: number) => {
  headers.value.splice(index, 1);
  updateHeaders();
};

const updateHeaders = () => {
  emit('update:modelValue', [...headers.value]);
};
</script>

<style scoped>
.request-headers {
  margin-bottom: var(--spacing-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.section-header h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.add-btn {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  padding: 5px 10px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 12px;
}

.add-btn:hover {
  background: var(--color-primary-dark);
}

.headers-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.header-item {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.header-input {
  flex: 1;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}

.header-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.remove-btn {
  background: var(--color-error);
  color: var(--color-text-inverse);
  border: none;
  padding: 8px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: var(--color-error-dark);
}
</style>
