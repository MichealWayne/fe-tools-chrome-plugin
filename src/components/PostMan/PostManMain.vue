<template>
  <div class="postman-container">
    <div class="postman-header">
      <h1>{{ t('postman.title') }}</h1>
      <div class="header-actions">
        <button @click="saveRequest" class="save-btn"><i class="fas fa-save"></i> 保存请求</button>
        <button @click="loadRequest" class="load-btn">
          <i class="fas fa-folder-open"></i> 加载请求
        </button>
      </div>
    </div>

    <!-- 环境变量组件 -->
    <EnvironmentVariables
      ref="envRef"
      v-model:environments="environments"
      v-model:current-environment="currentEnvironment"
    />

    <!-- 请求配置区域 -->
    <div class="request-section">
      <div class="request-line">
        <select v-model="request.method" class="method-select">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
          <option value="HEAD">HEAD</option>
          <option value="OPTIONS">OPTIONS</option>
        </select>

        <input
          v-model="request.url"
          :placeholder="t('postman.urlPlaceholder')"
          class="url-input"
          @keyup.enter="sendRequest"
        />

        <button @click="sendRequest" :disabled="loading || !request.url" class="send-btn">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-paper-plane"></i>
          {{ loading ? '请求中...' : '发送' }}
        </button>
      </div>

      <!-- 请求配置标签页 -->
      <div class="request-tabs">
        <button
          v-for="tab in requestTabs"
          :key="tab.key"
          @click="activeRequestTab = tab.key"
          :class="['tab-btn', { active: activeRequestTab === tab.key }]"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="request-tab-content">
        <!-- 请求头 -->
        <RequestHeaders v-if="activeRequestTab === 'headers'" v-model="request.headers" />

        <!-- 请求体 -->
        <RequestBody v-if="activeRequestTab === 'body'" v-model="request.body" />

        <!-- 认证 -->
        <div v-if="activeRequestTab === 'auth'" class="auth-section">
          <div class="auth-type">
            <label>认证类型：</label>
            <select v-model="request.auth.type" class="auth-select">
              <option value="none">无认证</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="api-key">API Key</option>
            </select>
          </div>

          <div v-if="request.auth.type === 'bearer'" class="auth-config">
            <input
              v-model="request.auth.token"
              placeholder="输入 Bearer Token"
              class="auth-input"
            />
          </div>

          <div v-else-if="request.auth.type === 'basic'" class="auth-config">
            <input v-model="request.auth.username" placeholder="用户名" class="auth-input" />
            <input
              v-model="request.auth.password"
              type="password"
              placeholder="密码"
              class="auth-input"
            />
          </div>

          <div v-else-if="request.auth.type === 'api-key'" class="auth-config">
            <input v-model="request.auth.key" placeholder="API Key 名称" class="auth-input" />
            <input v-model="request.auth.value" placeholder="API Key 值" class="auth-input" />
            <select v-model="request.auth.location" class="auth-select">
              <option value="header">Header</option>
              <option value="query">Query Parameter</option>
            </select>
          </div>
        </div>
      </div>
    </div>

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

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { langManager } from '@/utils/i18n';

const t = (key: string) => langManager.t(key);
import axios, { AxiosResponse, Method } from 'axios';
import RequestHeaders from './RequestHeaders.vue';
import RequestBody from './RequestBody.vue';
import ResponseViewer from './ResponseViewer.vue';
import RequestHistory from './RequestHistory.vue';
import EnvironmentVariables from './EnvironmentVariables.vue';

// 接口定义
interface Header {
  key: string;
  value: string;
}

interface RequestBodyData {
  type: string;
  json?: string;
  formData?: Array<{ key: string; value: string }>;
  urlencoded?: Array<{ key: string; value: string }>;
  raw?: string;
}

interface AuthConfig {
  type: string;
  token?: string;
  username?: string;
  password?: string;
  key?: string;
  value?: string;
  location?: string;
}

interface RequestConfig {
  method: string;
  url: string;
  headers: Header[];
  body: RequestBodyData;
  auth: AuthConfig;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
}

interface HistoryItem {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  status?: number;
  responseTime?: number;
}

interface Variable {
  key: string;
  value: string;
  description?: string;
}

interface Environment {
  name: string;
  variables: Variable[];
}

// 响应式数据
const loading = ref(false);
const error = ref('');
const response = ref<ResponseData | null>(null);
const responseTime = ref(0);
const responseSize = ref(0);
const activeRequestTab = ref('headers');
const envRef = ref();

// 请求配置
const request = reactive<RequestConfig>({
  method: 'GET',
  url: '',
  headers: [],
  body: {
    type: 'none',
  },
  auth: {
    type: 'none',
  },
});

// 环境变量
const environments = ref<Environment[]>([]);
const currentEnvironment = ref('');

// 请求历史
const requestHistory = ref<HistoryItem[]>([]);

// 标签页配置
const requestTabs = [
  { key: 'headers', label: '请求头' },
  { key: 'body', label: '请求体' },
  { key: 'auth', label: '认证' },
];

// 组件挂载时加载数据
onMounted(() => {
  loadFromStorage();
});

// 发送请求
const sendRequest = async () => {
  if (!request.url.trim()) {
    error.value = '请输入请求 URL';
    return;
  }

  loading.value = true;
  error.value = '';
  response.value = null;

  const startTime = Date.now();

  try {
    // 替换环境变量
    const processedUrl = envRef.value?.replaceVariables(request.url) || request.url;

    // 构建请求头
    const headers: Record<string, string> = {};

    // 添加用户自定义请求头
    request.headers.forEach(header => {
      if (header.key && header.value) {
        const processedValue = envRef.value?.replaceVariables(header.value) || header.value;
        headers[header.key] = processedValue;
      }
    });

    // 处理认证
    if (request.auth.type === 'bearer' && request.auth.token) {
      const processedToken =
        envRef.value?.replaceVariables(request.auth.token) || request.auth.token;
      headers['Authorization'] = `Bearer ${processedToken}`;
    } else if (request.auth.type === 'basic' && request.auth.username && request.auth.password) {
      const credentials = btoa(`${request.auth.username}:${request.auth.password}`);
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (request.auth.type === 'api-key' && request.auth.key && request.auth.value) {
      const processedValue =
        envRef.value?.replaceVariables(request.auth.value) || request.auth.value;
      if (request.auth.location === 'header') {
        headers[request.auth.key] = processedValue;
      }
    }

    // 构建请求体
    let requestData: any = undefined;

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (request.body.type === 'json' && request.body.json) {
        const processedJson =
          envRef.value?.replaceVariables(request.body.json) || request.body.json;
        requestData = JSON.parse(processedJson);
        headers['Content-Type'] = 'application/json';
      } else if (request.body.type === 'form-data' && request.body.formData) {
        const formData = new FormData();
        request.body.formData.forEach(item => {
          if (item.key && item.value) {
            const processedValue = envRef.value?.replaceVariables(item.value) || item.value;
            formData.append(item.key, processedValue);
          }
        });
        requestData = formData;
      } else if (request.body.type === 'x-www-form-urlencoded' && request.body.urlencoded) {
        const params = new URLSearchParams();
        request.body.urlencoded.forEach(item => {
          if (item.key && item.value) {
            const processedValue = envRef.value?.replaceVariables(item.value) || item.value;
            params.append(item.key, processedValue);
          }
        });
        requestData = params;
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (request.body.type === 'raw' && request.body.raw) {
        const processedRaw = envRef.value?.replaceVariables(request.body.raw) || request.body.raw;
        requestData = processedRaw;
      }
    }

    // 处理 API Key 查询参数
    let finalUrl = processedUrl;
    if (
      request.auth.type === 'api-key' &&
      request.auth.location === 'query' &&
      request.auth.key &&
      request.auth.value
    ) {
      const processedValue =
        envRef.value?.replaceVariables(request.auth.value) || request.auth.value;
      const separator = finalUrl.includes('?') ? '&' : '?';
      finalUrl += `${separator}${request.auth.key}=${encodeURIComponent(processedValue)}`;
    }

    // 发送请求
    const axiosResponse: AxiosResponse = await axios({
      method: request.method.toLowerCase() as Method,
      url: finalUrl,
      headers,
      data: requestData,
      timeout: 30000,
    });

    const endTime = Date.now();
    responseTime.value = endTime - startTime;

    // 处理响应
    response.value = {
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: axiosResponse.headers as Record<string, string>,
      data: axiosResponse.data,
    };

    // 计算响应大小
    const responseStr = JSON.stringify(axiosResponse.data);
    responseSize.value = new Blob([responseStr]).size;

    // 添加到历史记录
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
        // 服务器响应了错误状态码
        response.value = {
          status: err.response.status,
          statusText: err.response.statusText,
          headers: err.response.headers as Record<string, string>,
          data: err.response.data,
        };

        const responseStr = JSON.stringify(err.response.data);
        responseSize.value = new Blob([responseStr]).size;
      } else if (err.request) {
        // 请求已发出但没有收到响应
        error.value = '网络错误：无法连接到服务器';
      } else {
        // 其他错误
        error.value = `请求错误：${err.message}`;
      }
    } else {
      error.value = `未知错误：${(err as Error).message}`;
    }
  } finally {
    loading.value = false;
  }
};

// 历史记录管理
const addToHistory = (item: HistoryItem) => {
  requestHistory.value.unshift(item);

  // 限制历史记录数量
  if (requestHistory.value.length > 50) {
    requestHistory.value = requestHistory.value.slice(0, 50);
  }

  saveToStorage();
};

const loadHistoryItem = (item: HistoryItem) => {
  request.method = item.method;
  request.url = item.url;

  // 转换 headers 格式
  request.headers = Object.entries(item.headers).map(([key, value]) => ({ key, value }));

  // 重置其他配置
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

// 保存和加载请求
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

        // 加载请求配置
        Object.assign(request, requestData);
      } catch (error) {
        alert('加载失败：文件格式错误');
      }
    };
    reader.readAsText(file);
  };

  input.click();
};

// 本地存储
const saveToStorage = () => {
  const data = {
    environments: environments.value,
    currentEnvironment: currentEnvironment.value,
    requestHistory: requestHistory.value,
  };
  localStorage.setItem('postman-data', JSON.stringify(data));
};

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem('postman-data');
    if (data) {
      const parsed = JSON.parse(data);
      environments.value = parsed.environments || [];
      currentEnvironment.value = parsed.currentEnvironment || '';
      requestHistory.value = parsed.requestHistory || [];
    }
  } catch (error) {
    console.error('加载本地数据失败:', error);
  }
};

// 暴露给父组件的方法
defineExpose({
  sendRequest,
  saveRequest,
  loadRequest,
});
</script>

<style scoped>
.postman-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.postman-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.postman-header h1 {
  margin: 0;
  color: #333;
  font-size: 28px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.save-btn,
.load-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.save-btn:hover,
.load-btn:hover {
  background: #f8f9fa;
  border-color: #007bff;
}

.request-section {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.request-line {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
}

.method-select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  font-weight: bold;
  min-width: 100px;
}

.url-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.url-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.send-btn {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  min-width: 100px;
  transition: background-color 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #0056b3;
}

.send-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.request-tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 12px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  font-size: 14px;
}

.tab-btn:hover {
  background: #f8f9fa;
}

.tab-btn.active {
  border-bottom-color: #007bff;
  color: #007bff;
  font-weight: bold;
}

.request-tab-content {
  min-height: 200px;
}

.auth-section {
  padding: 20px 0;
}

.auth-type {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.auth-type label {
  font-weight: bold;
  color: #333;
}

.auth-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.auth-config {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.auth-input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.auth-input:focus {
  outline: none;
  border-color: #007bff;
}
</style>
