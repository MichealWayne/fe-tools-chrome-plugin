<template>
  <div class="response-viewer" :class="{ fullscreen: isFullscreen }" v-if="response">
    <div class="response-header">
      <div class="status-info">
        <span class="status" :class="getStatusClass(response.status)">
          {{ response.status }} {{ response.statusText }}
        </span>
        <span class="time">{{ response.responseTime }}ms</span>
        <span class="size">{{ formatSize(response.size) }}</span>
      </div>
      <button @click="copyResponse" class="copy-btn">{{ t('postman.actions.copyResponse') }}</button>
      <button
        @click="toggleFullscreen"
        class="fullscreen-btn"
        :title="
          isFullscreen ? t('postman.actions.exitFullscreen') : t('postman.actions.fullscreen')
        "
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

    <div class="response-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="{ active: activeTab === tab.key }"
        class="tab-btn"
      >
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="count">({{ tab.count }})</span>
      </button>
    </div>

    <div class="response-content">
      <!-- 响应体 -->
      <div :class="{ 'z-hide': activeTab !== 'body' }" class="response-body">
        <div v-if="isJsonResponse" class="json-viewer">
          <div id="formattingMsg" v-show="isFormatting">
            <span class="x-loading"></span>{{ t('postman.response.formatting') }}
          </div>
          <div id="jfCallbackNameStart" class="callback-name" v-html="jfCallbackNameStart"></div>
          <div id="jfContent" v-html="errorMsgForJson || ''"></div>
          <pre id="jfContent_pre" ref="jsonContentRef"></pre>
          <div id="jfCallbackNameEnd" class="callback-name" v-html="jfCallbackNameEnd"></div>
        </div>
        <div v-else-if="isHtmlResponse" class="html-viewer">
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

import DOMPurify from 'dompurify';
import JsonFormatEntrance from '@/utils/json-format.js';

const t = (key: string) => langManager.t(key);

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
  size: number;
}

interface Props {
  response: ResponseData | null;
}

const props = defineProps<Props>();

const activeTab = ref('body');
const isFormatting = ref(false);
const errorMsgForJson = ref('');
const jfCallbackNameStart = ref('');
const jfCallbackNameEnd = ref('');
const jsonContentRef = ref<HTMLElement>();
const isFullscreen = ref(false);

// 计算响应类型
const contentType = computed(() => {
  return props.response?.headers?.['content-type'] || '';
});

const isJsonResponse = computed(() => {
  return contentType.value.includes('application/json') || contentType.value.includes('text/json');
});

const isHtmlResponse = computed(() => {
  return contentType.value.includes('text/html') || contentType.value.includes('application/xhtml');
});

// 响应文本
const responseText = computed(() => {
  if (!props.response?.data) return '';
  return typeof props.response.data === 'string'
    ? props.response.data
    : JSON.stringify(props.response.data, null, 2);
});

// HTML 内容净化
const sanitizedHtml = computed(() => {
  if (!props.response?.data || !isHtmlResponse.value) return '';

  const htmlContent =
    typeof props.response.data === 'string' ? props.response.data : String(props.response.data);

  return DOMPurify.sanitize(htmlContent);
});

// Cookies 解析
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

// 标签页配置
const tabs = computed(() => [
  { key: 'body', label: t('postman.responseTabs.body') },
  {
    key: 'headers',
    label: t('postman.responseTabs.headers'),
    count: Object.keys(props.response?.headers || {}).length,
  },
  { key: 'cookies', label: t('postman.responseTabs.cookies'), count: cookies.value.length },
]);

// JSON 格式化函数
const jsonFormat = async (source: string) => {
  errorMsgForJson.value = '';
  jfCallbackNameStart.value = '';
  jfCallbackNameEnd.value = '';

  if (!source) {
    return false;
  }

  isFormatting.value = true;

  try {
    // JSONP形式下的callback name
    let funcName = null;
    // json对象
    let jsonObj = null;

    // 下面校验给定字符串是否为一个合法的json
    try {
      // 再看看是不是jsonp的格式
      const reg = /^([\w\.]+)\(\s*([\s\S]*)\s*\)$/gim;
      const matches = reg.exec(source);
      if (matches) {
        funcName = matches[1];
        source = matches[2];
      }
      // 这里可能会throw exception
      jsonObj = JSON.parse(source);
    } catch (ex) {
      // new Function的方式，能自动给key补全双引号，但是不支持bigint，所以是下下策，放在try-catch里搞
      try {
        jsonObj = new Function('return ' + source)();
      } catch (exx) {
        try {
          // 再给你一次机会，是不是下面这种情况：  "{\"ret\":\"0\", \"msg\":\"ok\"}"
          jsonObj = new Function(`return '${source}'`)();
          if (typeof jsonObj === 'string') {
            jsonObj = new Function('return ' + jsonObj)();
          }
        } catch (err) {
          errorMsgForJson.value = (err as Error).message;
        }
      }
    }

    // 是json格式，可以进行JSON自动格式化
    if (jsonObj !== null && typeof jsonObj === 'object' && !errorMsgForJson.value.length) {
      try {
        // 要尽量保证格式化的东西一定是一个json，所以需要把内容进行JSON.stringify处理
        source = JSON.stringify(jsonObj);
      } catch (err) {
        // 通过JSON反解不出来的，一定有问题
        errorMsgForJson.value = (err as any).message;
      }

      if (!errorMsgForJson.value?.length) {
        // 等待DOM更新
        await nextTick();

        // 格式化 - 调用 json-format.js 的格式化函数
        if (jsonContentRef.value) {
          JsonFormatEntrance(source);
        }

        // 如果是JSONP格式的，需要把方法名也显示出来
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

// 监听响应变化
watch(
  () => props.response,
  async () => {
    activeTab.value = 'body';

    // 如果是JSON响应，自动格式化
    if (props.response?.data && isJsonResponse.value) {
      const jsonData =
        typeof props.response.data === 'string'
          ? props.response.data
          : JSON.stringify(props.response.data);
      await jsonFormat(jsonData);
    }
  }
);

// 状态样式
const getStatusClass = (status: number) => {
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 400 && status < 500) return 'client-error';
  if (status >= 500) return 'server-error';
  return '';
};

// 文件大小格式化
const formatSize = (bytes?: number) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
};

// 复制响应
const copyResponse = async () => {
  try {
    await navigator.clipboard.writeText(responseText.value);
    // 可以添加成功提示
  } catch (error) {
    console.error('复制失败:', error);
  }
};

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};
</script>

<style>
#jfContent {
  -webkit-user-select: text;
  margin: 0;
}
#optionBar {
  -webkit-user-select: none;
  display: block;
  position: absolute;
  top: 0px;
  right: 0px;
}
#buttonFormatted,
#buttonCollapseAll,
#btnDownload {
  cursor: pointer;
  -webkit-border-radius: 2px;
  -webkit-box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);
  -webkit-user-select: none;
  background: -webkit-linear-gradient(#fafafa, #f4f4f4 40%, #e5e5e5);
  outline: none;
  border: 1px solid #aaa;
  color: #444;
  font-size: 12px;
  margin-bottom: 0px;
  min-width: 4em;
  padding: 0px 10px;
  position: relative;
  z-index: 10;
  display: inline-block;
  height: 30px;
  text-shadow: 1px 1px rgba(255, 255, 255, 0.3);
}
#buttonCollapseAll,
#btnDownload {
  margin-left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
#buttonFormatted,
#buttonCollapseAll {
  margin-right: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}
#buttonFormatted:hover,
#btnDownload:hover,
#buttonCollapseAll:hover {
  -webkit-box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.2);
  background: #ebebeb -webkit-linear-gradient(#fefefe, #f8f8f8 40%, #e9e9e9);
  border-color: #999;
  color: #222;
}
#buttonFormatted:active {
  -webkit-box-shadow: inset 0px 1px 3px rgba(0, 0, 0, 0.2);
  background: #ebebeb -webkit-linear-gradient(#f4f4f4, #efefef 40%, #dcdcdc);
  color: #333;
}
#buttonFormatted.selected,
#buttonCollapseAll.selected {
  -webkit-box-shadow: inset 0px 1px 5px rgba(0, 0, 0, 0.2);
  background: #ebebeb -webkit-linear-gradient(#e4e4e4, #dfdfdf 40%, #dcdcdc);
  color: #333;
}
#jsonpOpener,
#jsonpCloser {
  padding: 4px 0 0 8px;
  color: black;
  margin-bottom: -6px;
}
#jsonpCloser {
  margin-top: 0;
}
#formattedJson {
  padding-left: 28px;
  padding-top: 6px;
}
pre {
  padding: 36px 5px 5px 5px;
}
.kvov {
  display: block;
  padding-left: 20px;
  margin-left: -20px;
  position: relative;
  padding-top: 2px;
}

#jfContent {
  margin-bottom: 25px;
}
#jfContent .kvov .s a {
  color: #00b;
  text-decoration: underline;
}
#jfContent .kvov .s a:hover {
  color: #b00;
}
.collapsed {
  white-space: nowrap;
}
.collapsed > .blockInner {
  display: none;
}
.collapsed > .ell:after {
  content: '\2026';
  font-weight: bold;
}
.collapsed > .ell {
  margin: 0 4px;
  color: #888;
}
.collapsed .kvov {
  display: inline;
}
.e {
  width: 20px;
  height: 18px;
  display: block;
  position: absolute;
  left: -2px;
  top: 4px;
  z-index: 5;
  opacity: 0.35;
  -webkit-user-select: none;
  cursor: pointer;
}
.e:after {
  content: '\25bc';
}
.collapsed > .e {
  -webkit-transform: rotate(-90deg);
  top: -1px;
}
.e:hover {
  opacity: 0.35;
}
.e:active {
  opacity: 0.5;
}
.collapsed .kvov .e {
  display: none;
}
.blockInner {
  display: block;
  padding-left: 24px;
  border-left: 1px dotted #bbb;
  margin-left: 2px;
}
#formattedJson,
#jsonpOpener,
#jsonpCloser {
  color: #333;
  font: 13px/18px monospace;
}
#formattedJson {
  color: #444;
}
.b {
  font-weight: bold;
}
.s {
  color: #0b7500;
  word-wrap: break-word;
}
#jfContent a:link,
#jfContent a:visited {
  text-decoration: none;
  color: inherit;
}
#jfContent a:hover,
#jfContent a:active {
  text-decoration: underline;
  color: #050;
}
.bl,
.nl,
.n {
  font-weight: bold;
  color: #1a01cc;
}
.k {
  color: black;
}
#formattingMsg {
  display: none;
}
#formattingMsg .x-loading {
  width: 12px;
  height: 12px;
  border: 1px solid #f00;
  border-radius: 50%;
  box-shadow: 0 0 10px 2px;
  color: #cc0000;
  border-right-color: transparent;
  border-top-color: transparent;
  animation: spin-right 1s linear infinite normal;
  animation-delay: 0s;
  margin: 0 5px 0 0;
  display: inline-block;
}
#formattingMsg .x-loading:before {
  display: block;
  width: 8px;
  height: 8px;
  margin: 1px;
  border: 2px solid #f00;
  content: ' ';
  border-radius: 50%;
  border-left-color: transparent;
  border-bottom-color: transparent;
}
@keyframes spin-right {
  from {
    transform: rotate(0deg);
    opacity: 0.2;
  }
  50% {
    transform: rotate(180deg);
    opacity: 1;
  }
  to {
    transform: rotate(360deg);
    opacity: 0.2;
  }
}

[hidden] {
  display: none !important;
}
#jfContentspan {
  white-space: pre-wrap;
}
#jfContent .x-json-tips {
  color: red;
}
#jfContent_pre {
  padding: 0;
  margin: 0;
  word-break: break-word;
}

.mod-json .format-item button {
  width: 80px;
  height: 30px;
  float: right;
}
.mod-json .rst-item {
  position: relative;
  padding-top: 30px;
}
#jsonSource {
  height: 120px;
}
.mod-json .callback-name {
  font-weight: bolder;
  color: #a00;
}

#jfContent .x-hover {
  outline: 1px solid #cdc;
  background: #fff;
}
#jfContent .x-outline {
  outline: 1px solid #8ac;
  box-shadow: rgba(100, 100, 100, 0.4) -3px 3px 5px;
  font-weight: bold;
  background-color: #fffff8;
}
#boxOpt {
  display: none !important;
}
</style>

<style scoped>
.response-viewer {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  transition: all 0.3s ease;
}

.response-viewer.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  border-radius: 0;
  border: none;
  width: 100vw;
  height: 100vh;
}

.response-viewer.fullscreen .response-content {
  max-height: calc(100vh - 120px);
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
}

.status-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.status {
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.status.success {
  background: #d4edda;
  color: #155724;
}
.status.redirect {
  background: #fff3cd;
  color: #856404;
}
.status.client-error {
  background: #f8d7da;
  color: #721c24;
}
.status.server-error {
  background: #f5c6cb;
  color: #721c24;
}

.time,
.size {
  font-size: 14px;
  color: #666;
}

.copy-btn {
  padding: 6px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.copy-btn:hover {
  background: #0056b3;
}

.fullscreen-btn {
  padding: 6px 8px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-btn:hover {
  background: #5a6268;
}

.response-tabs {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
}

.tab-btn {
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  background: #e9ecef;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
  background: white;
}

.count {
  font-size: 12px;
  color: #999;
}

.response-content {
  max-height: 500px;
  overflow: auto;
}

.response-body {
  padding: 16px;
}

.json-viewer {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}

#formattingMsg {
  padding: 10px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.x-loading {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.callback-name {
  font-weight: bold;
  color: #007bff;
  margin: 5px 0;
}

#jfContent_pre {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.html-viewer {
  max-height: 400px;
  overflow: auto;
}

.html-preview {
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 4px;
  background: white;
}

.text-viewer pre {
  margin: 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.response-headers,
.response-cookies {
  padding: 16px;
}

.header-item,
.cookie-item {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.header-key,
.cookie-name {
  font-weight: 600;
  min-width: 200px;
  color: #333;
}

.header-value,
.cookie-value {
  color: #666;
  word-break: break-all;
}

.no-cookies,
.no-response {
  padding: 32px;
  text-align: center;
  color: #999;
}

/* JSON 语法高亮 */
:deep(.json-string) {
  color: #d14;
}
:deep(.json-number) {
  color: #099;
}
:deep(.json-boolean) {
  color: #0086b3;
}
:deep(.json-null) {
  color: #999;
}
:deep(.json-key) {
  color: #900;
  font-weight: 600;
}
:deep(.json-bracket) {
  color: #333;
  font-weight: 600;
}
:deep(.json-error) {
  color: #d14;
  background: #fff5f5;
}
</style>
