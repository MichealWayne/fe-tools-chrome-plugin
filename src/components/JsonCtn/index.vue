<template>
  <section class="json-converter">
    <div class="json-converter__header">
      <div class="json-converter__header-content">
        <h3>{{ t('jsonCtn.title') }}</h3>
        <p>
          {{ t('jsonCtn.description') }}
        </p>
      </div>
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

/**
 * Optional callback to return to the home view.
 */
const props = defineProps<{
  back?: () => void;
}>();

const jsValue = ref('');
const jsonValue = ref('');
const error = ref('');
const successVisible = ref(false);
const successMessage = ref('');
const indentLevel = ref(2);

/**
 * Debounced handler to avoid over-processing input changes.
 */
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

/**
 * Reset input, output, and error state.
 */
const clearInput = () => {
  jsValue.value = '';
  jsonValue.value = '';
  error.value = '';
};

/**
 * Convert JS-like input into formatted JSON.
 * @param noMsg - Skip success toast when true.
 */
const handleChange = (noMsg = false) => {
  let jsStr = jsValue.value;
  error.value = '';

  if (!jsStr) {
    jsonValue.value = '';
    return;
  }

  try {
    /**
     * Strip comments before parsing.
     */
    jsStr = removeComments(jsStr);

    /**
     * Extract the object portion for inputs that include extra text.
     */
    if (jsStr.includes('{') && jsStr.includes('}')) {
      jsStr = jsStr.slice(jsStr.indexOf('{'), jsStr.lastIndexOf('}') + 1);
    }

    /**
     * Evaluate the object in a constrained function scope.
     */
    const obj = safeEval(jsStr);
    if (!obj) {
      throw new Error(t('jsonCtn.messages.parseFailed'));
    }

    /**
     * Apply indentation settings and serialize output.
     */
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

/**
 * Convert JSON input back into a JS object literal string.
 */
const handleReverse = () => {
  error.value = '';

  if (!jsonValue.value) {
    return;
  }

  try {
    /**
     * Parse the JSON input to a JS object first.
     */
    const obj = JSON.parse(jsonValue.value);

    /**
     * Serialize the object as a JS object literal string.
     */
    jsValue.value = jsonToJsString(obj);
    showSuccess(t('jsonCtn.messages.reverseSuccess'));
  } catch (e) {
    console.error(e);
    error.value = t('jsonCtn.messages.reverseFailed', { message: (e as Error).message });
  }
};

/**
 * Safely evaluate JS-like object input by sanitizing first.
 * @param jsStr - Input text to evaluate.
 */
const safeEval = (jsStr: string) => {
  /**
   * Sanitize input to reduce risky constructs.
   */
  const sanitizedStr = DOMPurify.sanitize(jsStr);

  try {
    /**
     * Use Function constructor instead of eval to reduce scope exposure.
     */
    return Function(`"use strict"; return (${sanitizedStr})`)();
  } catch (e) {
    console.error('Safe eval failed:', e);
    throw e;
  }
};

/**
 * Remove JS comments from an input string.
 * @param code - Raw code string.
 */
const removeComments = (code: string) => {
  return code
    .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')
    .trim();
};

/**
 * Convert a JSON object to a formatted JS object literal string.
 * @param obj - Object to stringify.
 * @param indent - Indentation size.
 */
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

/**
 * Copy the formatted JSON output to the clipboard.
 */
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

/**
 * Reformat JSON output with a new indentation width.
 * @param spaces - Number of spaces to indent with.
 */
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

/**
 * Display a temporary success message in the UI.
 * @param message - Success copy to show.
 */
const showSuccess = (message: string) => {
  successMessage.value = message;
  successVisible.value = true;
  setTimeout(() => {
    successVisible.value = false;
  }, 2000);
};

/**
 * Invoke the parent callback to return to the home view.
 */
const handleBack = () => {
  if (props.back) {
    props.back();
  }
};
</script>

<style lang="less" scoped src="./json-ctn.less"></style>
