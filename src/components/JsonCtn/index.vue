<template>
  <section class="json-converter">
    <div class="json-converter__header">
      <div class="json-converter__header-content">
        <h3>{{ t('jsonCtn.title') }}</h3>
        <p>
          {{ t('jsonCtn.description') }}
        </p>
      </div>
      <a-button type="primary" size="small" class="json-converter__back-btn" @click="handleBack">
        <i class="u-icon icon-home"></i>
        {{ t('common.backHome') }}
      </a-button>
    </div>

    <div class="json-converter__content">
      <div class="json-converter__panel">
        <div class="json-converter__panel-header">
          <span>{{ t('jsonCtn.jsObject') }}</span>
          <a-button type="link" size="small" @click="clearInput" v-if="jsValue" class="clear-btn">
            <span>{{ t('common.clear') }}</span>
          </a-button>
        </div>
        <textarea
          v-model="jsValue"
          class="json-converter__textarea"
          :placeholder="t('jsonCtn.inputPlaceholder')"
        />
        <div class="json-converter__error" v-if="error">
          {{ error }}
        </div>
      </div>

      <div class="json-converter__divider">
        <div class="json-converter__action-icons">
          <a-tooltip :title="t('jsonCtn.actions.convert')">
            <span class="action-icon to-json" @click="handleChange()">→</span>
          </a-tooltip>
          <a-tooltip :title="t('jsonCtn.actions.reverse')">
            <span class="action-icon to-js" @click="handleReverse()">←</span>
          </a-tooltip>
        </div>
      </div>

      <div class="json-converter__panel">
        <div class="json-converter__panel-header">
          <span>{{ t('jsonCtn.jsonResult') }}</span>
          <div class="json-converter__panel-controls">
            <a-tooltip :title="t('jsonCtn.actions.copyToClipboard')">
              <a-button
                type="link"
                size="small"
                @click="copyToClipboard"
                :disabled="!jsonValue"
                class="copy-btn"
              >
                {{ t('jsonCtn.actions.copy') }}
              </a-button>
            </a-tooltip>
            <a-dropdown v-if="jsonValue">
              <a-button type="link" size="small" class="format-btn">
                {{ t('jsonCtn.actions.format') }}
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="formatJson(null)">{{
                    t('jsonCtn.actions.formatDefault')
                  }}</a-menu-item>
                  <a-menu-item @click="formatJson(0)">{{ t('jsonCtn.actions.formatMinify') }}</a-menu-item>
                  <a-menu-item @click="formatJson(2)">{{
                    t('jsonCtn.actions.formatIndent2')
                  }}</a-menu-item>
                  <a-menu-item @click="formatJson(4)">{{
                    t('jsonCtn.actions.formatIndent4')
                  }}</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
        <textarea
          v-model="jsonValue"
          class="json-converter__textarea"
          :placeholder="t('jsonCtn.outputPlaceholder')"
          :disabled="!jsonValue"
        />
      </div>
    </div>

    <div class="json-converter__tips">
      <h4>{{ t('jsonCtn.tips.title') }}</h4>
      <ul>
        <li>{{ t('jsonCtn.tips.item1') }}</li>
        <li>{{ t('jsonCtn.tips.item2') }}</li>
        <li>{{ t('jsonCtn.tips.item3') }}</li>
        <li>{{ t('jsonCtn.tips.item4') }}</li>
      </ul>
    </div>

    <a-modal
      v-model:visible="successVisible"
      :title="t('jsonCtn.modal.successTitle')"
      @ok="successVisible = false"
    >
      <p>{{ successMessage }}</p>
    </a-modal>
  </section>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { langManager } from '@/utils/i18n';

const t = (key: string, params?: Record<string, string | number>) =>
  langManager.t(key, params);
import DOMPurify from 'dompurify';

defineOptions({
  name: 'JsonCtn',
});

// 接收返回主页的方法
const props = defineProps<{
  back?: () => void;
}>();

const jsValue = ref('');
const jsonValue = ref('');
const error = ref('');
const successVisible = ref(false);
const successMessage = ref('');
const indentLevel = ref(2);

// 监听输入变化，自动转换
const debouncedWatch = (() => {
  let timeout: number | null = null;
  return (fn: Function) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn();
      timeout = null;
    }, 1000) as unknown as number;
  };
})();

watch(jsValue, val => {
  if (!val) {
    error.value = '';
    jsonValue.value = '';
    return;
  }

  debouncedWatch(() => {
    handleChange(true);
  });
});

// 清空输入
const clearInput = () => {
  jsValue.value = '';
  jsonValue.value = '';
  error.value = '';
};

// JS对象转JSON
const handleChange = (noMsg = false) => {
  let jsStr = jsValue.value;
  error.value = '';

  if (!jsStr) {
    jsonValue.value = '';
    return;
  }

  try {
    // 清理输入，移除注释
    jsStr = removeComments(jsStr);

    // 提取对象部分
    if (jsStr.includes('{') && jsStr.includes('}')) {
      jsStr = jsStr.slice(jsStr.indexOf('{'), jsStr.lastIndexOf('}') + 1);
    }

    // 安全地评估JS对象
    const obj = safeEval(jsStr);
    if (!obj) {
      throw new Error(t('jsonCtn.messages.parseFailed'));
    }

    // 格式化JSON
    jsonValue.value = JSON.stringify(obj, null, indentLevel.value);

    if (!noMsg) {
      showSuccess(t('jsonCtn.messages.convertSuccess'));
    }
  } catch (e) {
    console.error(e);
    error.value = t('jsonCtn.messages.convertFailed', { message: (e as Error).message });
    jsonValue.value = '';
  }
};

// JSON转JS对象
const handleReverse = () => {
  error.value = '';

  if (!jsonValue.value) {
    return;
  }

  try {
    // 尝试解析JSON
    const obj = JSON.parse(jsonValue.value);

    // 将JSON转为格式化的JS对象字符串
    jsValue.value = jsonToJsString(obj);
    showSuccess(t('jsonCtn.messages.reverseSuccess'));
  } catch (e) {
    console.error(e);
    error.value = t('jsonCtn.messages.reverseFailed', { message: (e as Error).message });
  }
};

// 安全地评估JS代码
const safeEval = (jsStr: string) => {
  // 清理输入
  const sanitizedStr = DOMPurify.sanitize(jsStr);

  try {
    // 使用Function构造函数而不是eval，稍微安全一些
    return Function(`"use strict"; return (${sanitizedStr})`)();
  } catch (e) {
    console.error('Safe eval failed:', e);
    throw e;
  }
};

// 移除JavaScript注释
const removeComments = (code: string) => {
  return code
    .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1') // 移除注释
    .trim();
};

// JSON转JS字符串
const jsonToJsString = (obj: any, indent = 2) => {
  const formatValue = (val: any, level = 0): string => {
    const spaces = ' '.repeat(level * indent);

    if (val === null) return 'null';
    if (val === undefined) return 'undefined';

    switch (typeof val) {
      case 'string':
        return `'${val.replace(/'/g, "\\'")}'`;
      case 'number':
      case 'boolean':
        return val.toString();
      case 'object':
        if (Array.isArray(val)) {
          if (val.length === 0) return '[]';
          const items = val.map(item => formatValue(item, level + 1)).join(',\n' + spaces + '  ');
          return `[\n${spaces}  ${items}\n${spaces}]`;
        } else {
          const keys = Object.keys(val);
          if (keys.length === 0) return '{}';

          const props = keys
            .map(key => {
              const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
                ? key
                : `'${key.replace(/'/g, "\\'")}'`;
              return `${keyStr}: ${formatValue(val[key], level + 1)}`;
            })
            .join(',\n' + spaces + '  ');

          return `{\n${spaces}  ${props}\n${spaces}}`;
        }
      default:
        return String(val);
    }
  };

  return formatValue(obj);
};

// 复制到剪贴板
const copyToClipboard = async () => {
  if (!jsonValue.value) return;

  try {
    await navigator.clipboard.writeText(jsonValue.value);
    showSuccess(t('jsonCtn.messages.copySuccess'));
  } catch (err) {
    console.error('复制失败:', err);
    error.value = t('jsonCtn.messages.copyFailed');
  }
};

// 格式化JSON
const formatJson = (spaces: number | null) => {
  if (!jsonValue.value) return;

  try {
    const obj = JSON.parse(jsonValue.value);
    indentLevel.value = spaces ?? 2;
    jsonValue.value = JSON.stringify(obj, null, spaces);
  } catch (e) {
    console.error(e);
    error.value = t('jsonCtn.messages.formatFailed', { message: (e as Error).message });
  }
};

// 显示成功消息
const showSuccess = (message: string) => {
  successMessage.value = message;
  successVisible.value = true;
  setTimeout(() => {
    successVisible.value = false;
  }, 2000);
};

// 返回主页
const handleBack = () => {
  if (props.back) {
    props.back();
  }
};
</script>

<style lang="less" scoped>
.json-converter {
  padding: 16px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

  &__header {
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    &-content {
      flex: 1;
    }

    h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #1a1a1a;
    }

    p {
      color: #666;
      margin: 0;
      font-size: 12px;
      line-height: 1.4;
    }
  }

  &__back-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;

    i {
      font-size: 14px;
    }
  }

  &__content {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  &__panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: box-shadow 0.3s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }
  }

  &__panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #eaedf3;

    span {
      font-weight: 600;
      font-size: 13px;
      color: #1a1a1a;
    }

    .clear-btn,
    .copy-btn,
    .format-btn {
      color: #1890ff;
      padding: 0 4px;
      font-size: 12px;

      &:hover {
        color: #40a9ff;
      }

      &:disabled {
        color: #bfbfbf;
      }
    }
  }

  &__panel-controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__textarea {
    flex: 1;
    min-height: 500px;
    padding: 12px;
    border: none;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    resize: vertical;
    background-color: #fafafa;
    transition: background-color 0.2s ease;

    &:focus {
      outline: none;
      background-color: #fff;
    }

    &:disabled {
      background-color: #f5f5f5;
      color: #666;
      cursor: default;
    }

    &::placeholder {
      color: #bbb;
      font-size: 13px;
    }
  }

  &__divider {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 20px;
  }

  &__action-icons {
    display: flex;
    flex-direction: column;
    gap: 5px;

    @media (max-width: 768px) {
      flex-direction: row;
      gap: 5px;
      margin: 2px 0;
    }

    .action-icon {
      cursor: pointer;
      font-size: 14px;
      width: 20px;
      height: 20px;
      line-height: 20px;
      text-align: center;
      border-radius: 50%;
      transition: all 0.2s ease;
      color: rgba(0, 0, 0, 0.45);
      user-select: none;

      &:hover {
        color: #1890ff;
        background-color: rgba(24, 144, 255, 0.1);
      }

      &.to-json {
        color: #1890ff;
      }
    }
  }

  &__error {
    padding: 4px 10px;
    background-color: #fff2f0;
    border-top: 1px solid #ffccc7;
    color: #f5222d;
    font-size: 12px;
  }

  &__tips {
    background-color: #f6f8fa;
    padding: 10px 12px;
    border-radius: 6px;
    border-left: 3px solid #1890ff;
    margin-top: 12px;
    font-size: 12px;

    h4 {
      margin-top: 0;
      margin-bottom: 6px;
      color: #1a1a1a;
      font-weight: 600;
      font-size: 13px;
    }

    ul {
      margin: 0;
      padding-left: 14px;

      li {
        margin-bottom: 3px;
        color: #666;
        font-size: 12px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style>
