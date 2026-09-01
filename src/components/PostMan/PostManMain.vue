<template>
  <div class="postman-container">
    <div class="postman-toolbar">
      <div class="environment-control">
        <label for="postman-environment">{{ t('postman.environments.active') }}</label>
        <select id="postman-environment" v-model="currentEnvironment" @change="saveToStorage">
          <option value="">{{ t('postman.environments.noEnvironment') }}</option>
          <option
            v-for="environment in environments"
            :key="environment.name"
            :value="environment.name"
          >
            {{ environment.name }}
          </option>
        </select>
      </div>
      <div class="header-actions">
        <button class="toolbar-btn" @click="toggleDrawer('environments')">
          <i class="fas fa-sliders" aria-hidden="true"></i> {{ t('postman.environments.manage') }}
        </button>
        <button class="toolbar-btn" @click="toggleDrawer('history')">
          <i class="fas fa-clock-rotate-left" aria-hidden="true"></i>
          {{ t('postman.history.title') }}
        </button>
        <button class="toolbar-btn" @click="toggleDrawer('saved')">
          <i class="fas fa-bookmark" aria-hidden="true"></i> {{ t('postman.saved.title') }}
        </button>
        <button class="toolbar-btn" @click="toggleDrawer('curl')">
          <i class="fas fa-terminal" aria-hidden="true"></i> cURL
        </button>
        <button class="save-btn" @click="saveRequest">
          <i class="fas fa-save" aria-hidden="true"></i> {{ t('postman.saveRequest') }}
        </button>
        <button class="load-btn" @click="loadRequest">
          <i class="fas fa-folder-open" aria-hidden="true"></i> {{ t('postman.loadRequest') }}
        </button>
      </div>
    </div>
    <inline-feedback :feedback="feedback" />

    <section
      v-if="activeDrawer"
      ref="drawerRef"
      class="postman-drawer"
      role="dialog"
      tabindex="-1"
      :aria-label="t('postman.drawerLabel')"
      @keydown.esc="closeDrawer"
      @keydown.tab="trapDrawerFocus"
    >
      <button class="drawer-close" :aria-label="t('common.close')" @click="closeDrawer">×</button>
      <EnvironmentVariables
        v-if="activeDrawer === 'environments'"
        ref="envRef"
        v-model:environments="environments"
        v-model:current-environment="currentEnvironment"
        @feedback="setFeedback"
      />
      <RequestHistory
        v-else-if="activeDrawer === 'history'"
        :history="requestHistory"
        @select-item="loadHistoryItem"
        @clear-history="clearHistory"
        @remove-item="removeHistoryItem"
        @toggle-favorite="toggleFavorite"
      />
      <SavedRequests
        v-else-if="activeDrawer === 'saved'"
        :items="savedRequests"
        :request="request"
        @update:items="
          savedRequests = $event;
          saveToStorage();
        "
        @load="loadSavedRequest"
        @feedback="setFeedback"
      />
      <CurlTools v-else :request="request" @apply="applyImportedRequest" @feedback="setFeedback" />
    </section>

    <div class="postman-workbench">
      <RequestPanel
        ref="requestPanelRef"
        :request="request"
        :loading="loading"
        :validation-message="validationMessage"
        :validation-field="validationField"
        @send-request="sendRequest"
        @cancel-request="cancel"
        @update:request="updateRequest"
      />
      <ResponseViewer
        :response="response"
        :execution-state="executionState"
        @feedback="setFeedback"
      />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'PostManMain',
};
</script>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, nextTick } from 'vue';
import { langManager } from '@/utils/i18n';

import RequestPanel from './RequestPanel.vue';
import ResponseViewer from './ResponseViewer.vue';
import RequestHistory from './RequestHistory.vue';
import EnvironmentVariables from './EnvironmentVariables.vue';
import type {
  PostmanRequestConfig,
  PostmanResponseData,
  PostmanHistoryItem,
  PostmanEnvironment,
  SavedRequest,
} from './types';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import type { InlineFeedbackMessage } from '@/types/experience';
import SavedRequests from './SavedRequests.vue';
import CurlTools from './CurlTools.vue';
import { useRequestExecution } from './composables/useRequestExecution';
import { replaceEnvironmentVariables } from './utils/environment';
import { validateRequest } from './utils/validation';
import { redactRequest } from './utils/redaction';
import { useRequestArchive } from './composables/useRequestArchive';
import { usePostmanWorkspace } from './composables/usePostmanWorkspace';
import { useDrawerFocus, type PostmanDrawer } from './composables/useDrawerFocus';

const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);

type RequestPanelRef = { focusUrl: () => void };

/**
 * Reactive state for request lifecycle and UI panels.
 */
const { state: executionState, loading, execute, cancel } = useRequestExecution();
const response = computed<PostmanResponseData | null>(() =>
  executionState.value.type === 'received' ? executionState.value.response : null
);
const requestPanelRef = ref<RequestPanelRef | null>(null);
const feedback = ref<InlineFeedbackMessage | null>(null);
const validationMessage = ref('');
const validationField = ref<'url' | 'body' | 'environment' | ''>('');
const activeDrawer = ref<PostmanDrawer>('');
const drawerRef = ref<HTMLElement | null>(null);

const setFeedback = (message: string, tone: 'success' | 'error') => {
  feedback.value = { message, tone };
};

/**
 * Active request configuration edited by the user.
 */
const request = reactive<PostmanRequestConfig>({
  method: 'GET' as const,
  url: '',
  queryParams: [],
  headers: [],
  body: {
    type: 'none',
  },
  auth: {
    type: 'none',
  },
  settings: { timeout: 30000 },
  environment: '',
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
const savedRequests = ref<SavedRequest[]>([]);

/**
 * Send the configured request and store the response.
 */
const sendRequest = async () => {
  if (loading.value) return;
  validationMessage.value = '';
  validationField.value = '';
  const activeEnvironment = environments.value.find(env => env.name === currentEnvironment.value);
  const issues = validateRequest(request, activeEnvironment?.variables || []);
  if (issues.length) {
    const issue = issues[0];
    validationMessage.value =
      issue.code === 'invalid-json'
        ? t('postman.body.jsonFormatError')
        : issue.code === 'unresolved-variable'
          ? t('postman.request.unresolvedVariables', { variables: issue.detail || '' })
          : t('postman.request.invalidUrl');
    setFeedback(validationMessage.value, 'error');
    validationField.value = issue.field;
    await nextTick();
    if (issue.field === 'url') requestPanelRef.value?.focusUrl();
    return;
  }
  const resolveValue = (value: string) =>
    replaceEnvironmentVariables(value, activeEnvironment?.variables || []);
  const result = await execute(request, resolveValue);
  if (result) {
    const redacted = redactRequest(request);
    addToHistory({
      id: `history-${Date.now()}`,
      method: request.method,
      url: request.url,
      headers: {},
      request: redacted.request,
      environment: currentEnvironment.value,
      timestamp: Date.now(),
      status: result.status,
      responseTime: result.responseTime,
      redacted: redacted.redacted,
    });
    setFeedback(t('postman.feedback.requestComplete'), 'success');
  }
};

const { toggleDrawer, closeDrawer, trapDrawerFocus } = useDrawerFocus({
  activeDrawer,
  drawerRef,
});

const { updateRequest, loadSavedRequest, applyImportedRequest } = usePostmanWorkspace({
  request,
  activeDrawer,
  setFeedback,
  translate: t,
});

const {
  saveToStorage,
  loadFromStorage,
  addToHistory,
  loadHistoryItem,
  clearHistory,
  toggleFavorite,
  removeHistoryItem,
  saveRequest,
  loadRequest,
} = useRequestArchive({
  request,
  environments,
  currentEnvironment,
  requestHistory,
  savedRequests,
  setFeedback,
  translate: t,
  focusUrl: () => requestPanelRef.value?.focusUrl(),
  closeDrawer,
  clearValidation: () => {
    validationMessage.value = '';
  },
});

onMounted(loadFromStorage);

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
