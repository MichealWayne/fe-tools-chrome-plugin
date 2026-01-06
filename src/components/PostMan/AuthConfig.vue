<template>
  <div class="auth-section">
    <div class="auth-type">
      <label>{{ t('postman.auth.typeLabel') }}</label>
      <select v-model="localAuth.type" class="auth-select" @change="updateAuth">
        <option value="none">{{ t('postman.auth.none') }}</option>
        <option value="bearer">{{ t('postman.auth.bearer') }}</option>
        <option value="basic">{{ t('postman.auth.basic') }}</option>
        <option value="api-key">{{ t('postman.auth.apiKey') }}</option>
      </select>
    </div>

    <div v-if="localAuth.type === 'bearer'" class="auth-config">
      <input
        v-model="localAuth.token"
        :placeholder="t('postman.auth.bearerPlaceholder')"
        class="auth-input"
        @input="updateAuth"
      />
    </div>

    <div v-else-if="localAuth.type === 'basic'" class="auth-config">
      <input
        v-model="localAuth.username"
        :placeholder="t('postman.auth.usernamePlaceholder')"
        class="auth-input"
        @input="updateAuth"
      />
      <input
        v-model="localAuth.password"
        type="password"
        :placeholder="t('postman.auth.passwordPlaceholder')"
        class="auth-input"
        @input="updateAuth"
      />
    </div>

    <div v-else-if="localAuth.type === 'api-key'" class="auth-config">
      <input
        v-model="localAuth.key"
        :placeholder="t('postman.auth.apiKeyNamePlaceholder')"
        class="auth-input"
        @input="updateAuth"
      />
      <input
        v-model="localAuth.value"
        :placeholder="t('postman.auth.apiKeyValuePlaceholder')"
        class="auth-input"
        @input="updateAuth"
      />
      <select v-model="localAuth.addTo" class="auth-select" @change="updateAuth">
        <option value="header">{{ t('postman.auth.addToHeader') }}</option>
        <option value="query">{{ t('postman.auth.addToQuery') }}</option>
      </select>
    </div>

    <div v-if="localAuth.type === 'none'" class="auth-info">
      <p>{{ t('postman.auth.noAuthInfo') }}</p>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'AuthConfig',
};
</script>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { langManager } from '@/utils/i18n';
import type { AuthConfig } from '@/types/components';

const t = (key: string) => langManager.t(key);

/**
 * Props for AuthConfig editor.
 */
interface Props {
  modelValue: AuthConfig;
}

const props = defineProps<Props>();

/**
 * Emits for two-way binding of auth configuration.
 */
const emit = defineEmits<{
  'update:modelValue': [auth: AuthConfig];
}>();

/**
 * Local auth draft state mirrored from props.
 */
const localAuth = reactive<AuthConfig>({
  type: 'none',
  ...props.modelValue,
});

/**
 * Sync incoming modelValue updates into local state.
 */
watch(
  () => props.modelValue,
  newAuth => {
    Object.assign(localAuth, newAuth);
  },
  { deep: true }
);

/**
 * Emit the updated auth configuration to the parent.
 */
const updateAuth = () => {
  emit('update:modelValue', { ...localAuth });
};
</script>

<style scoped>
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

.auth-info {
  padding: 15px;
  background: #e9ecef;
  border-radius: 4px;
  margin-top: 15px;
}

.auth-info p {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
  text-align: center;
}
</style>
