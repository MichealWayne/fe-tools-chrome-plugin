<template>
  <div class="postman-container">
    <div class="postman-header">
      <h1>{{ t('postman.title') }}</h1>
      <div class="header-actions">
        <button @click="saveRequest" class="save-btn">
          <i class="fas fa-save"></i> {{ t('postman.saveRequest') }}
        </button>
        <button @click="loadRequest" class="load-btn">
          <i class="fas fa-folder-open"></i> {{ t('postman.loadRequest') }}
        </button>
      </div>
    </div>

    <!-- 环境变量组件 -->
    <EnvironmentVariables
      ref="envRef"
      v-model:environments="environments"
      v-model:current-environment="currentEnvironment"
    />

    <!-- 请求配置面板 -->
    <RequestPanel
      :request="request"
      :loading="loading"
      @send-request="sendRequest"
      @update:request="handleRequestUpdate"
    />

    <!-- 响应区域 -->
    <ResponseViewer
      :response="response"
      :loading="loading"
      :error="error"
      :response-time="responseTime"
      :response-size="responseSize"
    />

    <!-- 请求历史 -->
    <RequestHistory
      :history="requestHistory"
      @select-item="loadHistoryItem"
      @clear-history="clearHistory"
      @remove-item="removeHistoryItem"
    />
  </div>
</template>

<script lang="ts">
export default {
  name: 'PostManMain',
};
</script>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { langManager } from '@/utils/i18n';

import axios, { AxiosResponse, Method } from 'axios';
import RequestPanel from './RequestPanel.vue';
import ResponseViewer from './ResponseViewer.vue';
import RequestHistory from './RequestHistory.vue';
import EnvironmentVariables from './EnvironmentVariables.vue';
import { buildRequestPayload } from './utils/request-builder';
import { loadPostmanStorage, savePostmanStorage } from './utils/storage';
import type {
  PostmanRequestConfig,
  PostmanResponseData,
  PostmanHistoryItem,
  PostmanEnvironment,
} from './types';

const t = (key: string, params?: Record<string, string | number>) =>
  langManager.t(key, params);

type EnvRef = {
  replaceVariables: (value: string) => string;
};

/**
 * Reactive state for request lifecycle and UI panels.
 */
const loading = ref(false);
const error = ref('');
const response = ref<PostmanResponseData | null>(null);
const responseTime = ref(0);
const responseSize = ref(0);
const activeRequestTab = ref('headers');
const envRef = ref<EnvRef | null>(null);

/**
 * Active request configuration edited by the user.
 */
const request = reactive<PostmanRequestConfig>({
  method: 'GET' as const,
  url: '',
  headers: [],
  body: {
    type: 'none',
  },
  auth: {
    type: 'none',
  },
});

/**
 * Environment variable sets for templating requests.
 */
const environments = ref<PostmanEnvironment[]>([]);
const currentEnvironment = ref('');

/**
 * Request history for quick replay and auditing.
 */
const requestHistory = ref<PostmanHistoryItem[]>([]);

/**
 * Load persisted request data on mount.
 */
onMounted(() => {
  loadFromStorage();
});

/**
 * Send the configured request and store the response.
 */
const sendRequest = async () => {
  if (!request.url.trim()) {
    error.value = t('postman.request.missingUrl');
    return;
  }

  loading.value = true;
  error.value = '';
  response.value = null;

  const startTime = Date.now();

  try {
    const resolveValue = (value: string) => envRef.value?.replaceVariables(value) || value;
    const { url: finalUrl, headers, data: requestData } = buildRequestPayload(
      request,
      resolveValue
    );

    /**
     * Dispatch the request via Axios and capture response metadata.
     */
    const axiosResponse: AxiosResponse = await axios({
      method: request.method.toLowerCase() as Method,
      url: finalUrl,
      headers,
      data: requestData,
      timeout: 30000,
    });

    const endTime = Date.now();
    responseTime.value = endTime - startTime;

    /**
     * Normalize response metadata for the viewer.
     */
    response.value = {
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: axiosResponse.headers as Record<string, string>,
      data: axiosResponse.data,
      responseTime: responseTime.value,
      size: JSON.stringify(axiosResponse.data).length,
    };

    /**
     * Measure response size for display.
     */
    const responseStr = JSON.stringify(axiosResponse.data);
    responseSize.value = new Blob([responseStr]).size;

    /**
     * Persist the request in history for quick reuse.
     */
    addToHistory({
      method: request.method,
      url: request.url,
      headers: headers,
      body: requestData,
      timestamp: Date.now(),
      status: axiosResponse.status,
      responseTime: responseTime.value,
    });
  } catch (err) {
    const endTime = Date.now();
    responseTime.value = endTime - startTime;

    if (axios.isAxiosError(err)) {
      if (err.response) {
        /**
         * Server responded with an error status code.
         */
        const responseStr = JSON.stringify(err.response.data);
        responseSize.value = new Blob([responseStr]).size;
        response.value = {
          status: err.response.status,
          statusText: err.response.statusText,
          headers: err.response.headers as Record<string, string>,
          data: err.response.data,
          responseTime: responseTime.value,
          size: responseSize.value,
        };
      } else if (err.request) {
        /**
         * Request was sent but no response was received.
         */
        error.value = t('postman.request.networkError');
      } else {
        /**
         * Non-network errors raised during request setup.
         */
        error.value = t('postman.request.requestError', { message: err.message });
      }
    } else {
      error.value = t('postman.request.unknownError', { message: (err as Error).message });
    }
  } finally {
    loading.value = false;
  }
};

/**
 * Insert a history entry and cap list length.
 * @param item - History record to insert.
 */
const addToHistory = (item: PostmanHistoryItem) => {
  requestHistory.value.unshift(item);

  /**
   * Keep history bounded to reduce storage overhead.
   */
  if (requestHistory.value.length > 50) {
    requestHistory.value = requestHistory.value.slice(0, 50);
  }

  saveToStorage();
};

const loadHistoryItem = (item: PostmanHistoryItem) => {
  request.method = item.method;
  request.url = item.url;

  /**
   * Convert headers from object map into editable list entries.
   */
  request.headers = Object.entries(item.headers).map(([key, value]) => ({ key, value }));

  /**
   * Reset body and auth settings before loading stored payloads.
   */
  request.body = { type: 'none' };
  request.auth = { type: 'none' };

  if (item.body) {
    if (typeof item.body === 'string') {
      request.body = { type: 'raw', raw: item.body };
    } else if (item.body instanceof FormData) {
      request.body = { type: 'form-data', formData: [] };
    } else {
      request.body = { type: 'json', json: JSON.stringify(item.body, null, 2) };
    }
  }
};

const clearHistory = () => {
  requestHistory.value = [];
  saveToStorage();
};

const removeHistoryItem = (index: number) => {
  requestHistory.value.splice(index, 1);
  saveToStorage();
};

/**
 * Export the current request configuration to a JSON file.
 */
const saveRequest = () => {
  const requestData = {
    ...request,
    timestamp: Date.now(),
  };

  const dataStr = JSON.stringify(requestData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `postman-request-${Date.now()}.json`;
  link.click();

  URL.revokeObjectURL(url);
};

/**
 * Import a request configuration from a JSON file.
 */
const loadRequest = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = e => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const requestData = JSON.parse(e.target?.result as string);

        /**
         * Apply imported request configuration to the editor.
         */
        Object.assign(request, requestData);
      } catch (error) {
        alert(t('postman.request.loadFailed'));
      }
    };
    reader.readAsText(file);
  };

  input.click();
};

/**
 * Persist environment and history data to localStorage.
 */
const saveToStorage = () => {
  savePostmanStorage({
    environments: environments.value,
    currentEnvironment: currentEnvironment.value,
    requestHistory: requestHistory.value,
  });
};

/**
 * Restore environment and history data from localStorage.
 */
const loadFromStorage = () => {
  const data = loadPostmanStorage();
  environments.value = data.environments;
  currentEnvironment.value = data.currentEnvironment;
  requestHistory.value = data.requestHistory;
};

/**
 * Apply request updates from child components.
 * @param newRequest - Partial request data.
 */
const handleRequestUpdate = (newRequest: Partial<PostmanRequestConfig>) => {
  Object.assign(request, newRequest);
};

/**
 * Expose request actions for parent components.
 */
defineExpose({
  sendRequest,
  saveRequest,
  loadRequest,
});
</script>

<style scoped src="./styles/postman-main.scoped.css"></style>
