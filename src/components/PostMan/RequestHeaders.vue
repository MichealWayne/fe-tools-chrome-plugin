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
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-header h3 {
  margin: 0;
  color: #333;
}

.add-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.add-btn:hover {
  background: #0056b3;
}

.headers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.header-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.header-input:focus {
  outline: none;
  border-color: #007bff;
}

.remove-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #c82333;
}
</style>
