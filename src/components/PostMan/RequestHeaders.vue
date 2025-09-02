<template>
  <div class="request-headers">
    <div class="section-header">
      <h3>请求头</h3>
      <button @click="addHeader" class="add-btn"><i class="fas fa-plus"></i> 添加</button>
    </div>

    <div class="headers-list">
      <div v-for="(header, index) in headers" :key="index" class="header-item">
        <input
          v-model="header.key"
          placeholder="Header Key"
          class="header-input"
          @input="updateHeaders"
        />
        <input
          v-model="header.value"
          placeholder="Header Value"
          class="header-input"
          @input="updateHeaders"
        />
        <button @click="removeHeader(index)" class="remove-btn">X</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { langManager } from '@/utils/i18n';

const t = (key: string) => langManager.t(key);

interface Header {
  key: string;
  value: string;
}

const props = defineProps<{
  modelValue: Header[];
}>();

const emit = defineEmits<{
  'update:modelValue': [headers: Header[]];
}>();

const headers = ref<Header[]>([...props.modelValue]);

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
