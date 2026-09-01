<template>
  <div class="request-section">
    <!-- 请求行 -->
    <div class="request-line">
      <select v-model="localRequest.method" class="method-select" @change="updateRequest">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
        <option value="PATCH">PATCH</option>
        <option value="HEAD">HEAD</option>
        <option value="OPTIONS">OPTIONS</option>
      </select>

      <input
        ref="urlInput"
        v-model="localRequest.url"
        :placeholder="t('postman.urlPlaceholder')"
        class="url-input"
        :aria-label="t('postman.urlPlaceholder')"
        @keyup.enter="$emit('send-request')"
        @input="handleUrlInput"
      />

      <label class="timeout-control" :title="t('postman.request.timeoutLabel')">
        <span class="z-hide">{{ t('postman.request.timeoutLabel') }}</span>
        <input
          v-model.number="localRequest.settings!.timeout"
          type="number"
          min="100"
          step="100"
          :aria-label="t('postman.request.timeoutLabel')"
          @change="updateRequest"
        />
        <span>ms</span>
      </label>

      <button
        :disabled="!loading && !localRequest.url"
        :title="
          loading
            ? t('postman.feedback.requestPending')
            : !localRequest.url
              ? t('postman.request.missingUrl')
              : ''
        "
        class="send-btn"
        @click="loading ? $emit('cancel-request') : $emit('send-request')"
      >
        <i v-if="loading" class="fas fa-stop"></i>
        <i v-else class="fas fa-paper-plane"></i>
        {{ loading ? t('postman.actions.cancel') : t('postman.actions.send') }}
      </button>
    </div>
    <p v-if="validationMessage" class="request-validation" role="alert">{{ validationMessage }}</p>

    <!-- 请求配置标签页 -->
    <div class="request-tabs">
      <button
        v-for="tab in requestTabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        role="tab"
        :aria-selected="activeTab === tab.key"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="request-tab-content">
      <KeyValueEditor
        v-if="activeTab === 'params'"
        v-model="queryParams"
        :key-placeholder="t('postman.editor.key')"
        :value-placeholder="t('postman.editor.value')"
        @update:model-value="handleParamsUpdate"
      />
      <!-- 请求头 -->
      <RequestHeaders
        v-if="activeTab === 'headers'"
        v-model="localRequest.headers"
        @update:model-value="updateRequest"
      />

      <!-- 请求体 -->
      <RequestBody
        v-if="activeTab === 'body'"
        v-model="localRequest.body"
        @update:model-value="updateRequest"
      />
      <p v-if="activeTab === 'body' && bodyOmitted" class="method-notice" role="note">
        {{ t('postman.body.omittedForMethod', { method: localRequest.method }) }}
      </p>

      <!-- 认证 -->
      <div v-if="activeTab === 'auth'" class="auth-section">
        <div class="auth-type">
          <label>{{ t('postman.auth.typeLabel') }}</label>
          <select v-model="localRequest.auth.type" class="auth-select" @change="updateRequest">
            <option value="none">{{ t('postman.auth.none') }}</option>
            <option value="bearer">{{ t('postman.auth.bearer') }}</option>
            <option value="basic">{{ t('postman.auth.basic') }}</option>
            <option value="api-key">{{ t('postman.auth.apiKey') }}</option>
          </select>
        </div>

        <div v-if="localRequest.auth.type === 'bearer'" class="auth-config">
          <input
            v-model="localRequest.auth.token"
            :placeholder="t('postman.auth.bearerPlaceholder')"
            class="auth-input"
            @input="updateRequest"
          />
        </div>

        <div v-else-if="localRequest.auth.type === 'basic'" class="auth-config">
          <input
            v-model="localRequest.auth.username"
            :placeholder="t('postman.auth.usernamePlaceholder')"
            class="auth-input"
            @input="updateRequest"
          />
          <input
            v-model="localRequest.auth.password"
            type="password"
            :placeholder="t('postman.auth.passwordPlaceholder')"
            class="auth-input"
            @input="updateRequest"
          />
        </div>

        <div v-else-if="localRequest.auth.type === 'api-key'" class="auth-config">
          <input
            v-model="localRequest.auth.key"
            :placeholder="t('postman.auth.apiKeyNamePlaceholder')"
            class="auth-input"
            @input="updateRequest"
          />
          <input
            v-model="localRequest.auth.value"
            :placeholder="t('postman.auth.apiKeyValuePlaceholder')"
            class="auth-input"
            @input="updateRequest"
          />
          <select v-model="localRequest.auth.addTo" class="auth-select" @change="updateRequest">
            <option value="header">{{ t('postman.auth.addToHeader') }}</option>
            <option value="query">{{ t('postman.auth.addToQuery') }}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'RequestPanel',
};
</script>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { langManager } from '@/utils/i18n';
import type { PostmanRequestConfig } from './types';
import RequestHeaders from './RequestHeaders.vue';
import RequestBody from './RequestBody.vue';
import KeyValueEditor from './KeyValueEditor.vue';
import type { QueryParameterEntry } from './types';
import { normalizeRequest } from './utils/request-model';
import { parseRequestUrl, serializeRequestUrl } from './utils/url-params';
const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);

/**
 * Props for the request editor panel.
 */
interface Props {
  request: PostmanRequestConfig;
  loading?: boolean;
  validationMessage?: string;
  validationField?: 'url' | 'body' | 'environment' | '';
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  validationMessage: '',
  validationField: '',
});

/**
 * Emits for request updates and send action.
 */
const emit = defineEmits<{
  'update:request': [request: PostmanRequestConfig];
  'send-request': [];
  'cancel-request': [];
}>();

/**
 * Local draft copy of the request configuration.
 */
const localRequest = reactive<PostmanRequestConfig>(normalizeRequest(props.request));
const queryParams = ref<QueryParameterEntry[]>(localRequest.queryParams || []);
let syncingParams = false;

/**
 * Active request tab (headers/body/auth).
 */
const activeTab = ref('headers');
const urlInput = ref<HTMLInputElement | null>(null);

/**
 * Tab metadata for the request editor.
 */
const requestTabs = computed(() => [
  { key: 'params', label: tabLabel('postman.requestTabs.params', queryParams.value) },
  { key: 'headers', label: tabLabel('postman.requestTabs.headers', localRequest.headers) },
  { key: 'body', label: t('postman.requestTabs.body') },
  { key: 'auth', label: t('postman.requestTabs.auth') },
]);
const bodyOmitted = computed(() => localRequest.method === 'GET' || localRequest.method === 'HEAD');

/**
 * Keep local state in sync with incoming props.
 */
watch(
  () => props.request,
  newRequest => {
    const normalized = normalizeRequest(newRequest);
    Object.assign(localRequest, normalized);
    queryParams.value = normalized.queryParams || [];
  },
  { deep: true }
);

watch(
  () => props.validationField,
  field => {
    if (field === 'body') activeTab.value = 'body';
  }
);

/**
 * Emit the updated request to the parent.
 */
const updateRequest = () => {
  emit('update:request', normalizeRequest({ ...localRequest, queryParams: queryParams.value }));
};

function tabLabel(key: string, entries: QueryParameterEntry[]) {
  const count = entries.filter(entry => entry.enabled !== false && entry.key).length;
  return `${t(key)}${count ? ` (${count})` : ''}`;
}

const handleUrlInput = () => {
  if (!syncingParams) {
    const parsed = parseRequestUrl(localRequest.url);
    if (parsed) queryParams.value = parsed.params;
  }
  updateRequest();
};

const handleParamsUpdate = () => {
  const next = serializeRequestUrl(localRequest.url, queryParams.value);
  if (next) {
    syncingParams = true;
    localRequest.url = next;
    syncingParams = false;
  }
  updateRequest();
};

defineExpose({
  focusUrl: () => urlInput.value?.focus(),
});
</script>

<style scoped>
.request-section {
  background: var(--color-background-light);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.request-line {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  align-items: center;
}

.method-select {
  padding: 10px 15px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background: var(--color-background-light);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  cursor: pointer;
  min-width: 100px;
}

.method-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-shadow-dark);
}

.url-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.url-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-shadow-dark);
}

.timeout-control {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-tertiary);
}
.timeout-control input {
  width: 78px;
  padding: 10px 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
}

.send-btn {
  padding: 10px 20px;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  min-width: 100px;
  transition: background-color var(--transition-normal);
}

.send-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.send-btn:disabled {
  background: var(--color-text-tertiary);
  cursor: not-allowed;
}

.request-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: var(--spacing-lg);
}

.tab-btn {
  padding: var(--padding-md);
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  border-bottom: 2px solid transparent;
  transition: var(--transition-normal);
}

.tab-btn:hover {
  color: var(--color-primary);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

.request-tab-content {
  min-height: 200px;
}

.auth-section {
  padding: var(--spacing-lg);
  background: var(--color-background);
  border-radius: var(--border-radius-md);
}

.auth-type {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.auth-type label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  min-width: 80px;
}

.auth-select {
  padding: var(--padding-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-background-light);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.auth-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.auth-config {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.auth-input {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  transition: border-color var(--transition-normal);
}

.auth-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-shadow-dark);
}

.auth-input::placeholder {
  color: var(--color-text-tertiary);
}

.request-validation,
.method-notice {
  margin: calc(var(--spacing-md) * -1) 0 var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  background: var(--color-error-surface);
  color: var(--color-error-foreground);
}

.method-notice {
  margin: var(--spacing-sm) 0;
  background: var(--color-info-surface);
  color: var(--color-info-foreground);
}
</style>
