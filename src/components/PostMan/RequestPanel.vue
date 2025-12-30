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
        v-model="localRequest.url"
        :placeholder="t('postman.urlPlaceholder')"
        class="url-input"
        @keyup.enter="$emit('send-request')"
        @input="updateRequest"
      />

      <button
        @click="$emit('send-request')"
        :disabled="loading || !localRequest.url"
        class="send-btn"
      >
        <i v-if="loading" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-paper-plane"></i>
        {{ loading ? t('postman.actions.sending') : t('postman.actions.send') }}
      </button>
    </div>

    <!-- 请求配置标签页 -->
    <div class="request-tabs">
      <button
        v-for="tab in requestTabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="request-tab-content">
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
import type { PostmanRequest } from '@/types/components';
import RequestHeaders from './RequestHeaders.vue';
import RequestBody from './RequestBody.vue';
// import AuthConfig from './AuthConfig.vue';

const t = (key: string) => langManager.t(key);

// Props
interface Props {
  request: PostmanRequest;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// Emits
const emit = defineEmits<{
  'update:request': [request: PostmanRequest];
  'send-request': [];
}>();

// 本地请求数据
const localRequest = reactive<PostmanRequest>({
  method: 'GET',
  url: '',
  headers: [],
  body: { type: 'none' },
  auth: { type: 'none' },
  ...props.request,
});

// 当前活跃的标签页
const activeTab = ref('headers');

// 标签页配置
const requestTabs = computed(() => [
  { key: 'headers', label: t('postman.requestTabs.headers') },
  { key: 'body', label: t('postman.requestTabs.body') },
  { key: 'auth', label: t('postman.requestTabs.auth') },
]);

// 监听props变化
watch(
  () => props.request,
  newRequest => {
    Object.assign(localRequest, newRequest);
  },
  { deep: true }
);

// 更新请求数据
const updateRequest = () => {
  emit('update:request', { ...localRequest });
};
</script>

<style scoped>
.request-section {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.request-line {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.method-select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  min-width: 100px;
}

.method-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
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
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 12px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #007bff;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
  font-weight: bold;
}

.request-tab-content {
  min-height: 200px;
}

.auth-section {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.auth-type {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.auth-type label {
  font-weight: 500;
  color: #333;
  min-width: 80px;
}

.auth-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

.auth-select:focus {
  outline: none;
  border-color: #007bff;
}

.auth-config {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.auth-input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.auth-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.auth-input::placeholder {
  color: #999;
}
</style>
