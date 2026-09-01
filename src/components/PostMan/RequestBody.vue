<template>
  <div class="request-body">
    <div class="section-header">
      <h3>{{ t('postman.body.title') }}</h3>
      <select v-model="bodyType" class="body-type-select" @change="onBodyTypeChange">
        <option value="none">{{ t('postman.body.types.none') }}</option>
        <option value="json">{{ t('postman.body.types.json') }}</option>
        <option value="form-data">{{ t('postman.body.types.formData') }}</option>
        <option value="x-www-form-urlencoded">{{ t('postman.body.types.xForm') }}</option>
        <option value="raw">{{ t('postman.body.types.raw') }}</option>
      </select>
    </div>

    <div v-if="bodyType === 'json'" class="json-body">
      <textarea
        v-model="jsonBody"
        :placeholder="t('postman.body.jsonPlaceholder')"
        class="json-textarea"
        @input="updateBody"
      ></textarea>
      <button class="format-btn" @click="formatJson">{{ t('postman.actions.formatJson') }}</button>
      <inline-feedback
        :feedback="formatError ? { message: formatError, tone: 'validation' } : null"
      />
    </div>

    <div v-else-if="bodyType === 'form-data'" class="form-data-body">
      <KeyValueEditor
        v-model="formData"
        :key-placeholder="t('postman.body.formKey')"
        :value-placeholder="t('postman.body.formValue')"
        @update:model-value="updateBody"
      />
    </div>

    <div v-else-if="bodyType === 'x-www-form-urlencoded'" class="urlencoded-body">
      <KeyValueEditor
        v-model="urlencodedData"
        :key-placeholder="t('postman.body.formKey')"
        :value-placeholder="t('postman.body.formValue')"
        @update:model-value="updateBody"
      />
    </div>

    <div v-else-if="bodyType === 'raw'" class="raw-body">
      <textarea
        v-model="rawBody"
        :placeholder="t('postman.body.rawPlaceholder')"
        class="raw-textarea"
        @input="updateBody"
      ></textarea>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'RequestBody',
};
</script>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { langManager } from '@/utils/i18n';
import type { FormDataEntry, RequestBodyData } from './types';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import KeyValueEditor from './KeyValueEditor.vue';
import { normalizeEntries } from './utils/request-model';

const t = (key: string) => langManager.t(key);

const props = defineProps<{
  modelValue: RequestBodyData;
}>();

const emit = defineEmits<{
  'update:modelValue': [body: RequestBodyData];
}>();

const bodyType = ref(props.modelValue.type || 'none');
const jsonBody = ref(props.modelValue.json || '');
const formData = ref<FormDataEntry[]>(normalizeEntries(props.modelValue.formData || []));
const urlencodedData = ref<FormDataEntry[]>(normalizeEntries(props.modelValue.urlencoded || []));
const rawBody = ref(props.modelValue.raw || '');
const formatError = ref('');

watch(
  () => props.modelValue,
  newValue => {
    bodyType.value = newValue.type || 'none';
    jsonBody.value = newValue.json || '';
    formData.value = normalizeEntries(newValue.formData || []);
    urlencodedData.value = normalizeEntries(newValue.urlencoded || []);
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
  formatError.value = '';
  try {
    const parsed = JSON.parse(jsonBody.value);
    jsonBody.value = JSON.stringify(parsed, null, 2);
    updateBody();
  } catch (error) {
    formatError.value = t('postman.body.jsonFormatError');
  }
};
</script>

<style scoped>
.request-body {
  margin-bottom: var(--spacing-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.section-header h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.body-type-select {
  padding: 5px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-background-light);
}

.json-textarea,
.raw-textarea {
  width: 100%;
  min-height: 200px;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  font-family: 'Courier New', monospace;
  font-size: var(--font-size-sm);
  resize: vertical;
}

.json-textarea:focus,
.raw-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.format-btn {
  margin-top: 10px;
  background: var(--color-success);
  color: var(--color-text-inverse);
  border: none;
  padding: 5px 15px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
}

.format-btn:hover {
  background: var(--color-success-dark);
}

.form-item {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.form-input {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.add-btn {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  padding: 8px 15px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  margin-top: 10px;
}

.add-btn:hover {
  background: var(--color-primary-dark);
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
