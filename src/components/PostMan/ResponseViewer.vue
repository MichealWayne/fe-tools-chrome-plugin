<template>
  <div
    v-if="executionState && executionState.type !== 'received'"
    class="response-state"
    :data-state="executionState.type"
    role="status"
  >
    <i :class="stateIcon" aria-hidden="true"></i>
    <strong>{{ stateTitle }}</strong>
    <span v-if="executionState.type === 'network-error'">{{ executionState.message }}</span>
  </div>
  <div v-else-if="response" class="response-viewer" :class="{ fullscreen: isFullscreen }">
    <div class="response-header">
      <div class="status-info">
        <span class="status" :class="getStatusClass(response.status)">
          {{ response.status }} {{ response.statusText }}
        </span>
        <span class="time">{{ response.responseTime }}ms</span>
        <span class="size">{{ formatSize(response.size) }}</span>
      </div>
      <div class="response-actions">
        <button class="copy-btn" @click="copyResponse">
          {{ t('postman.actions.copyResponse') }}
        </button>
        <button class="utility-btn" @click="downloadResponse">
          {{ t('postman.actions.download') }}
        </button>
        <button
          ref="fullscreenButton"
          class="fullscreen-btn"
          :aria-label="
            isFullscreen ? t('postman.actions.exitFullscreen') : t('postman.actions.fullscreen')
          "
          :title="
            isFullscreen ? t('postman.actions.exitFullscreen') : t('postman.actions.fullscreen')
          "
          @click="toggleFullscreen"
        >
          <svg
            v-if="!isFullscreen"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
            />
          </svg>
          <svg
            v-else
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="response-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="{ active: activeTab === tab.key }"
        class="tab-btn"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="count">({{ tab.count }})</span>
      </button>
    </div>

    <div class="response-content">
      <!-- 响应体 -->
      <div :class="{ 'z-hide': activeTab !== 'body' }" class="response-body">
        <div class="response-tools">
          <div class="view-modes" role="tablist" :aria-label="t('postman.response.viewMode')">
            <button
              v-for="mode in availableModes"
              :key="mode"
              :class="{ active: bodyMode === mode }"
              role="tab"
              :aria-selected="bodyMode === mode"
              @click="bodyMode = mode"
            >
              {{ t(`postman.response.modes.${mode}`) }}
            </button>
          </div>
          <label class="response-search">
            <span class="z-hide">{{ t('postman.response.search') }}</span>
            <input v-model="searchQuery" :placeholder="t('postman.response.search')" />
            <span v-if="searchQuery">{{
              searchCount ? `${searchIndex + 1}/${searchCount}` : '0/0'
            }}</span>
            <button
              type="button"
              :disabled="!searchCount"
              :aria-label="t('postman.response.previousMatch')"
              @click="moveSearch(-1)"
            >
              ↑
            </button>
            <button
              type="button"
              :disabled="!searchCount"
              :aria-label="t('postman.response.nextMatch')"
              @click="moveSearch(1)"
            >
              ↓
            </button>
          </label>
        </div>
        <div v-if="bodyMode === 'pretty' && isJsonResponse" class="json-viewer">
          <div v-show="isFormatting" id="formattingMsg">
            <span class="x-loading"></span>{{ t('postman.response.formatting') }}
          </div>
          <div id="jfCallbackNameStart" class="callback-name" v-html="safeCallbackNameStart"></div>
          <div id="jfContent" v-html="safeErrorMsgForJson"></div>
          <pre id="jfContent_pre" ref="jsonContentRef"></pre>
          <div id="jfCallbackNameEnd" class="callback-name" v-html="safeCallbackNameEnd"></div>
        </div>
        <div v-else-if="bodyMode === 'preview' && isHtmlResponse" class="html-viewer">
          <div class="html-preview" v-html="sanitizedHtml"></div>
        </div>
        <div v-else class="text-viewer">
          <pre>{{ responseText }}</pre>
        </div>
      </div>

      <!-- 响应头 -->
      <div :class="{ 'z-hide': activeTab !== 'headers' }" class="response-headers">
        <div v-for="(value, key) in response.headers" :key="key" class="header-item">
          <span class="header-key">{{ key }}:</span>
          <span class="header-value">{{ value }}</span>
          <button
            type="button"
            :aria-label="`${t('common.copy')} ${key}`"
            @click="copyText(String(value))"
          >
            <i class="fas fa-copy" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <!-- Cookies -->
      <div :class="{ 'z-hide': activeTab !== 'cookies' }" class="response-cookies">
        <div v-if="cookies.length === 0" class="no-cookies">
          {{ t('postman.response.noCookies') }}
        </div>
        <div v-else>
          <div v-for="cookie in cookies" :key="cookie.name" class="cookie-item">
            <span class="cookie-name">{{ cookie.name }}:</span>
            <span class="cookie-value">{{ cookie.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="no-response">{{ t('postman.response.noResponse') }}</div>
</template>

<script lang="ts">
export default {
  name: 'ResponseViewer',
};
</script>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { langManager } from '@/utils/i18n';

import JsonFormatEntrance from '@/utils/json-format.js';
import { sanitizeHtml, sanitizeInlineMarkup } from '@/utils/sanitize';
import type { PostmanResponseData, RequestExecutionState } from './types';

const t = (key: string) => langManager.t(key);

interface Props {
  response?: PostmanResponseData | null;
  executionState?: RequestExecutionState;
}

const props = withDefaults(defineProps<Props>(), { response: null, executionState: undefined });
const emit = defineEmits<{
  feedback: [message: string, tone: 'success' | 'error'];
}>();

const activeTab = ref('body');
const isFormatting = ref(false);
const errorMsgForJson = ref('');
const jfCallbackNameStart = ref('');
const jfCallbackNameEnd = ref('');
const jsonContentRef = ref<HTMLElement>();
const isFullscreen = ref(false);
const bodyMode = ref<'pretty' | 'raw' | 'preview'>('pretty');
const searchQuery = ref('');
const searchIndex = ref(0);
const fullscreenButton = ref<HTMLButtonElement | null>(null);

/**
 * Resolve response content-type for view selection.
 */
const contentType = computed(() => {
  return String(props.response?.headers?.['content-type'] || '');
});

const isJsonResponse = computed(() => {
  return contentType.value.includes('application/json') || contentType.value.includes('text/json');
});

const isHtmlResponse = computed(() => {
  return contentType.value.includes('text/html') || contentType.value.includes('application/xhtml');
});

const availableModes = computed<Array<'pretty' | 'raw' | 'preview'>>(() =>
  isHtmlResponse.value ? ['pretty', 'raw', 'preview'] : ['pretty', 'raw']
);

const searchCount = computed(() => {
  if (!searchQuery.value) return 0;
  return responseText.value.toLowerCase().split(searchQuery.value.toLowerCase()).length - 1;
});

const stateTitle = computed(() => {
  const type = props.executionState?.type || 'idle';
  return t(`postman.response.states.${type}`);
});

const stateIcon = computed(() =>
  props.executionState?.type === 'pending' ? 'fas fa-spinner fa-spin' : 'fas fa-circle-exclamation'
);

watch(searchQuery, () => {
  searchIndex.value = 0;
});

/**
 * Stringified response body for raw display and clipboard.
 */
const responseText = computed(() => {
  if (!props.response?.data) return '';
  return typeof props.response.data === 'string'
    ? props.response.data
    : JSON.stringify(props.response.data, null, 2);
});

/**
 * Sanitize HTML response bodies for safe rendering.
 */
const sanitizedHtml = computed(() => {
  if (!props.response?.data || !isHtmlResponse.value) return '';

  const htmlContent =
    typeof props.response.data === 'string' ? props.response.data : String(props.response.data);

  return sanitizeHtml(htmlContent);
});

/**
 * Sanitize inline JSONP labels and error messages.
 */
const safeCallbackNameStart = computed(() => sanitizeInlineMarkup(jfCallbackNameStart.value || ''));
const safeCallbackNameEnd = computed(() => sanitizeInlineMarkup(jfCallbackNameEnd.value || ''));
const safeErrorMsgForJson = computed(() => sanitizeInlineMarkup(errorMsgForJson.value || ''));

/**
 * Parse Set-Cookie headers into display-friendly pairs.
 */
const cookies = computed(() => {
  const setCookieHeader = props.response?.headers?.['set-cookie'];
  if (!setCookieHeader) return [];

  const cookieStrings = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return cookieStrings.map(cookieStr => {
    const [nameValue] = cookieStr.split(';');
    const [name, value] = nameValue.split('=');
    return { name: name?.trim() || '', value: value?.trim() || '' };
  });
});

/**
 * Build the response tab list with count badges.
 */
const tabs = computed(() => [
  { key: 'body', label: t('postman.responseTabs.body') },
  {
    key: 'headers',
    label: t('postman.responseTabs.headers'),
    count: Object.keys(props.response?.headers || {}).length,
  },
  { key: 'cookies', label: t('postman.responseTabs.cookies'), count: cookies.value.length },
]);

/**
 * Format JSON (or JSONP) response into the custom viewer.
 * @param source - Raw response string to format.
 */
const jsonFormat = async (source: string) => {
  errorMsgForJson.value = '';
  jfCallbackNameStart.value = '';
  jfCallbackNameEnd.value = '';

  if (!source) {
    return false;
  }

  isFormatting.value = true;

  try {
    /**
     * JSONP callback function name if present.
     */
    let funcName = null;
    /**
     * Parsed JSON object once validation succeeds.
     */
    let jsonObj = null;

    /**
     * Validate JSON or JSONP payloads and attempt fallback parsing.
     */
    try {
      /**
       * Detect JSONP wrapper and extract the payload.
       */
      const reg = /^([\w\.]+)\(\s*([\s\S]*)\s*\)$/gim;
      const matches = reg.exec(source);
      if (matches) {
        funcName = matches[1];
        source = matches[2];
      }
      /**
       * Parse JSON once any JSONP wrapper is removed.
       */
      jsonObj = JSON.parse(source);
    } catch (error) {
      errorMsgForJson.value = (error as Error).message;
    }

    /**
     * Once parsed, attempt to format and render the JSON content.
     */
    if (jsonObj !== null && typeof jsonObj === 'object' && !errorMsgForJson.value.length) {
      try {
        /**
         * Re-stringify to ensure valid JSON input for the formatter.
         */
        source = JSON.stringify(jsonObj);
      } catch (err) {
        /**
         * If stringify fails, the payload is not a valid JSON object.
         */
        errorMsgForJson.value = (err as any).message;
      }

      if (!errorMsgForJson.value?.length) {
        /**
         * Wait for the DOM to be ready before injecting formatted output.
         */
        await nextTick();

        /**
         * Delegate to json-format.js for structured rendering.
         */
        if (jsonContentRef.value) {
          JsonFormatEntrance(source);
        }

        /**
         * Show JSONP wrapper names when present.
         */
        if (funcName !== null) {
          jfCallbackNameStart.value = funcName + '(';
          jfCallbackNameEnd.value = ')';
        } else {
          jfCallbackNameStart.value = '';
          jfCallbackNameEnd.value = '';
        }
      }
    }
  } finally {
    isFormatting.value = false;
  }
};

/**
 * Reformat JSON when the response payload changes.
 */
watch(
  () => props.response,
  async () => {
    activeTab.value = 'body';
    bodyMode.value = 'pretty';
    searchQuery.value = '';

    /**
     * Auto-format JSON responses for the viewer.
     */
    if (props.response?.data && isJsonResponse.value) {
      const jsonData =
        typeof props.response.data === 'string'
          ? props.response.data
          : JSON.stringify(props.response.data);
      await jsonFormat(jsonData);
    }
  }
);

/**
 * Map HTTP status codes to CSS class names.
 * @param status - HTTP status code.
 */
const getStatusClass = (status: number) => {
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 400 && status < 500) return 'client-error';
  if (status >= 500) return 'server-error';
  return '';
};

/**
 * Convert byte counts into human-readable units.
 * @param bytes - Size in bytes.
 */
const formatSize = (bytes?: number) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Copy the response body to the clipboard.
 */
const copyResponse = async () => {
  await copyText(responseText.value);
};

const copyText = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    emit('feedback', t('postman.feedback.responseCopied'), 'success');
  } catch (error) {
    emit('feedback', t('postman.feedback.copyFailed'), 'error');
  }
};

const moveSearch = (offset: number) => {
  if (!searchCount.value) return;
  searchIndex.value = (searchIndex.value + offset + searchCount.value) % searchCount.value;
};

/**
 * Toggle full-screen view for the response panel.
 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  if (!isFullscreen.value) nextTick(() => fullscreenButton.value?.focus());
};

const downloadResponse = () => {
  const mime = contentType.value.split(';')[0] || 'text/plain';
  const extension = mime.includes('json') ? 'json' : mime.includes('html') ? 'html' : 'txt';
  const url = URL.createObjectURL(new Blob([responseText.value], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `api-response-${Date.now()}.${extension}`;
  link.click();
  URL.revokeObjectURL(url);
};
</script>

<style src="./styles/response-viewer.base.css"></style>
<style scoped src="./styles/response-viewer.scoped.css"></style>
