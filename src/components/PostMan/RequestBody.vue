<template>
  <div class="request-body">
    <div class="section-header">
      <h3>请求体</h3>
      <select v-model="bodyType" @change="onBodyTypeChange" class="body-type-select">
        <option value="none">None</option>
        <option value="json">JSON</option>
        <option value="form-data">Form Data</option>
        <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
        <option value="raw">Raw</option>
      </select>
    </div>

    <div v-if="bodyType === 'json'" class="json-body">
      <textarea
        v-model="jsonBody"
        placeholder="输入 JSON 数据"
        class="json-textarea"
        @input="updateBody"
      ></textarea>
      <button @click="formatJson" class="format-btn">格式化 JSON</button>
    </div>

    <div v-else-if="bodyType === 'form-data'" class="form-data-body">
      <div v-for="(item, index) in formData" :key="index" class="form-item">
        <input v-model="item.key" placeholder="Key" class="form-input" @input="updateBody" />
        <input v-model="item.value" placeholder="Value" class="form-input" @input="updateBody" />
        <button @click="removeFormItem(index)" class="remove-btn">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <button @click="addFormItem" class="add-btn"><i class="fas fa-plus"></i> 添加字段</button>
    </div>

    <div v-else-if="bodyType === 'x-www-form-urlencoded'" class="urlencoded-body">
      <div v-for="(item, index) in urlencodedData" :key="index" class="form-item">
        <input v-model="item.key" placeholder="Key" class="form-input" @input="updateBody" />
        <input v-model="item.value" placeholder="Value" class="form-input" @input="updateBody" />
        <button @click="removeUrlencodedItem(index)" class="remove-btn">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <button @click="addUrlencodedItem" class="add-btn">
        <i class="fas fa-plus"></i> 添加字段
      </button>
    </div>

    <div v-else-if="bodyType === 'raw'" class="raw-body">
      <textarea
        v-model="rawBody"
        placeholder="输入原始数据"
        class="raw-textarea"
        @input="updateBody"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { langManager } from '@/utils/i18n';

const t = (key: string) => langManager.t(key);

interface FormDataItem {
  key: string;
  value: string;
}

interface RequestBodyData {
  type: string;
  json?: string;
  formData?: FormDataItem[];
  urlencoded?: FormDataItem[];
  raw?: string;
}

const props = defineProps<{
  modelValue: RequestBodyData;
}>();

const emit = defineEmits<{
  'update:modelValue': [body: RequestBodyData];
}>();

const bodyType = ref(props.modelValue.type || 'none');
const jsonBody = ref(props.modelValue.json || '');
const formData = ref<FormDataItem[]>(props.modelValue.formData || []);
const urlencodedData = ref<FormDataItem[]>(props.modelValue.urlencoded || []);
const rawBody = ref(props.modelValue.raw || '');

watch(
  () => props.modelValue,
  newValue => {
    bodyType.value = newValue.type || 'none';
    jsonBody.value = newValue.json || '';
    formData.value = newValue.formData || [];
    urlencodedData.value = newValue.urlencoded || [];
    rawBody.value = newValue.raw || '';
  },
  { deep: true }
);

const onBodyTypeChange = () => {
  updateBody();
};

const updateBody = () => {
  const bodyData: RequestBodyData = {
    type: bodyType.value,
    json: jsonBody.value,
    formData: [...formData.value],
    urlencoded: [...urlencodedData.value],
    raw: rawBody.value,
  };
  emit('update:modelValue', bodyData);
};

const formatJson = () => {
  try {
    const parsed = JSON.parse(jsonBody.value);
    jsonBody.value = JSON.stringify(parsed, null, 2);
    updateBody();
  } catch (error) {
    alert('JSON 格式错误');
  }
};

const addFormItem = () => {
  formData.value.push({ key: '', value: '' });
  updateBody();
};

const removeFormItem = (index: number) => {
  formData.value.splice(index, 1);
  updateBody();
};

const addUrlencodedItem = () => {
  urlencodedData.value.push({ key: '', value: '' });
  updateBody();
};

const removeUrlencodedItem = (index: number) => {
  urlencodedData.value.splice(index, 1);
  updateBody();
};
</script>

<style scoped>
.request-body {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h3 {
  margin: 0;
  color: #333;
}

.body-type-select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.json-textarea,
.raw-textarea {
  width: 100%;
  min-height: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
}

.json-textarea:focus,
.raw-textarea:focus {
  outline: none;
  border-color: #007bff;
}

.format-btn {
  margin-top: 10px;
  background: #28a745;
  color: white;
  border: none;
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.format-btn:hover {
  background: #218838;
}

.form-item {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}

.form-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
}

.add-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.add-btn:hover {
  background: #0056b3;
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
