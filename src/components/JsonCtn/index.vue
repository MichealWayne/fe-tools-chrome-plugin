<template>
  <section class="json-converter">
    <json-workbench
      :input="jsValue"
      :output="jsonValue"
      :error-position="parseLocation"
      @import="importJson"
      @select="selectText"
      @error="error = $event"
    />
    <div class="json-converter__content">
      <div class="json-converter__panel">
        <div class="json-converter__panel-header">
          <span>{{ t('jsonCtn.jsObject') }}</span>
          <button
            v-if="jsValue"
            type="button"
            class="tool-button tool-button--text clear-btn"
            @click="clearInput"
          >
            {{ t('common.clear') }}
          </button>
        </div>
        <textarea
          ref="inputEditor"
          v-model="jsValue"
          class="json-converter__textarea"
          :placeholder="t('jsonCtn.inputPlaceholder')"
        />
        <inline-feedback :feedback="error ? { message: error, tone: 'validation' } : null" />
      </div>

      <div class="json-converter__divider">
        <div class="json-converter__action-icons">
          <button
            type="button"
            class="tool-button tool-button--small action-icon to-json"
            :aria-label="t('jsonCtn.actions.convert')"
            :title="t('jsonCtn.actions.convert')"
            @click="handleChange()"
          >
            {{ t('jsonCtn.actions.convert') }}
          </button>
          <button
            type="button"
            class="tool-button tool-button--small action-icon to-js"
            :aria-label="t('jsonCtn.actions.reverse')"
            :title="t('jsonCtn.actions.reverse')"
            @click="handleReverse()"
          >
            {{ t('jsonCtn.actions.reverse') }}
          </button>
        </div>
      </div>

      <div class="json-converter__panel">
        <div class="json-converter__panel-header">
          <span>{{ t('jsonCtn.jsonResult') }}</span>
          <div class="json-converter__panel-controls">
            <CopyButton
              :value="jsonValue"
              :label="t('jsonCtn.actions.copy')"
              class="tool-button--text copy-btn"
              :title="t('jsonCtn.actions.copyToClipboard')"
            />
            <select
              v-if="jsonValue"
              class="format-btn"
              :aria-label="t('jsonCtn.actions.format')"
              :value="indentLevel"
              @change="handleFormatChange"
            >
              <option value="default">{{ t('jsonCtn.actions.formatDefault') }}</option>
              <option value="0">{{ t('jsonCtn.actions.formatMinify') }}</option>
              <option value="2">{{ t('jsonCtn.actions.formatIndent2') }}</option>
              <option value="4">{{ t('jsonCtn.actions.formatIndent4') }}</option>
            </select>
          </div>
        </div>
        <textarea
          ref="outputEditor"
          v-model="jsonValue"
          class="json-converter__textarea"
          :placeholder="t('jsonCtn.outputPlaceholder')"
        />
      </div>
    </div>

    <details class="json-converter__tips">
      <summary>{{ t('jsonCtn.tips.title') }}</summary>
      <ul>
        <li>{{ t('jsonCtn.tips.item1') }}</li>
        <li>{{ t('jsonCtn.tips.item2') }}</li>
        <li>{{ t('jsonCtn.tips.item3') }}</li>
        <li>{{ t('jsonCtn.tips.item4') }}</li>
      </ul>
    </details>

    <inline-feedback
      :feedback="successVisible ? { message: successMessage, tone: 'success' } : null"
    />
  </section>
</template>

<script lang="ts" setup>
import CopyButton from '@/components/Experience/CopyButton.vue';
import { onBeforeUnmount, ref, watch } from 'vue';
import JsonWorkbench from './JsonWorkbench.vue';
import { jsonErrorOffset, revealTextSelection, type JsonSelection } from './workbench';
import { useTextDraft } from '@/composables/useTextDraft';
import { langManager } from '@/utils/i18n';

const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';

defineOptions({
  name: 'JsonCtn',
});

defineProps<{
  back?: () => void;
}>();

const jsValue = ref('');
const jsonValue = ref('');
useTextDraft('json-input', jsValue);
useTextDraft('json-output', jsonValue);
const error = ref('');
const successVisible = ref(false);
const successMessage = ref('');
const indentLevel = ref(2);
const parseLocation = ref<JsonSelection>();
const inputEditor = ref<HTMLTextAreaElement | null>(null);
const outputEditor = ref<HTMLTextAreaElement | null>(null);
const selectText = (selection: JsonSelection) => {
  const editor = selection.target === 'input' ? inputEditor.value : outputEditor.value;
  if (editor) revealTextSelection(editor, selection.start, selection.end);
};
const importJson = (value: string) => {
  jsValue.value = value;
  jsonValue.value = value;
  error.value = '';
  parseLocation.value = undefined;
};
watch([jsValue, jsonValue], () => {
  parseLocation.value = undefined;
});
const setParserLocation = (cause: unknown) => {
  const offset = jsonErrorOffset(jsonValue.value, cause);
  if (offset !== undefined)
    parseLocation.value = {
      target: 'output',
      start: offset,
      end: Math.min(offset + 1, jsonValue.value.length),
    };
};

const BLOCKED_EXPRESSION_TOKENS =
  /\b(?:chrome|browser|window|document|globalThis|location|history|navigator|localStorage|sessionStorage|indexedDB|caches|fetch|XMLHttpRequest|WebSocket|importScripts|eval|Function|constructor|prototype|__proto__)\b/;

const getExecutableSource = (value: string) => {
  const withoutQuotedStrings = value.replace(/(['"])(?:\\.|(?!\1)[^\\])*\1/g, "''");
  return withoutQuotedStrings.replace(/`(?:\\.|[^`])*`/g, template => {
    return Array.from(template.matchAll(/\$\{([^{}]*)\}/g), match => match[1]).join(' ');
  });
};

/**
 * Keep the legacy JavaScript-expression compatibility while rejecting direct access to
 * browser and extension capabilities. This is a guardrail, not a replacement for a parser.
 */
const assertSafeExpression = (value: string) => {
  if (BLOCKED_EXPRESSION_TOKENS.test(getExecutableSource(value))) {
    throw new Error(t('jsonCtn.messages.unsafeExpression'));
  }
};

/**
 * Debounced handler to avoid over-processing input changes.
 */
let conversionTimer: ReturnType<typeof setTimeout> | undefined;
const debouncedWatch = (fn: () => void) => {
  clearTimeout(conversionTimer);
  conversionTimer = setTimeout(fn, 1000);
};
onBeforeUnmount(() => clearTimeout(conversionTimer));

watch(jsValue, val => {
  if (!val) {
    clearTimeout(conversionTimer);
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
    let obj: unknown;
    try {
      obj = JSON.parse(jsStr);
    } catch {
      jsStr = removeComments(jsStr);
      if (jsStr.includes('{') && jsStr.includes('}'))
        jsStr = jsStr.slice(jsStr.indexOf('{'), jsStr.lastIndexOf('}') + 1);
      obj = safeEval(jsStr);
    }
    if (obj === undefined) throw new Error(t('jsonCtn.messages.parseFailed'));

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
    setParserLocation(e);
    error.value = t('jsonCtn.messages.reverseFailed', { message: (e as Error).message });
  }
};

/**
 * Evaluate JS-like object input after blocking direct browser/extension capability access.
 * @param jsStr - Input text to evaluate.
 */
const safeEval = (jsStr: string) => {
  assertSafeExpression(jsStr);

  try {
    /**
     * Use Function constructor instead of eval to reduce scope exposure.
     */
    return Function(`"use strict"; return (${jsStr})`)();
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
  return code.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1').trim();
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
 * Reformat JSON output with a new indentation width.
 * @param spaces - Number of spaces to indent with.
 */
const formatJson = (spaces: number | null) => {
  if (!jsonValue.value) return;

  try {
    const obj = JSON.parse(jsonValue.value);
    indentLevel.value = spaces ?? 2;
    jsonValue.value = JSON.stringify(obj, null, spaces ?? 2);
  } catch (e) {
    console.error(e);
    setParserLocation(e);
    error.value = t('jsonCtn.messages.formatFailed', { message: (e as Error).message });
  }
};

const handleFormatChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  formatJson(value === 'default' ? null : Number(value));
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
</script>

<style lang="less" scoped src="./json-ctn.less"></style>
