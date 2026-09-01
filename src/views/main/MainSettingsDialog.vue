<template>
  <div
    class="settings-window"
    role="dialog"
    aria-modal="true"
    aria-labelledby="settings-title"
    @keydown="handleKeydown"
  >
    <div ref="panel" class="settings-window__panel" tabindex="-1">
      <header class="settings-window__header">
        <strong id="settings-title">{{ translate('settings.title') }}</strong>
        <button
          class="settings-window__close"
          type="button"
          :aria-label="translate('settings.close')"
          :title="translate('settings.close')"
          @click="emit('close')"
        >
          <i class="u-icon icon-close" aria-hidden="true"></i>
        </button>
      </header>
      <div class="settings-window__body">
        <label class="settings-field">
          <span class="settings-field__label">{{ translate('settings.language') }}</span>
          <select
            :value="currentLang"
            class="settings-select"
            aria-describedby="settings-language-help"
            @change="handleLanguageChange"
          >
            <option value="zh">{{ translate('languageOptions.zh') }}</option>
            <option value="en">{{ translate('languageOptions.en') }}</option>
          </select>
          <span id="settings-language-help" class="settings-field__help">{{
            translate('settings.languageHelp')
          }}</span>
        </label>
        <label class="settings-field settings-field--inline">
          <span>
            <span class="settings-field__label">{{ translate('settings.pinyinSearch') }}</span>
            <span id="settings-pinyin-help" class="settings-field__help">{{
              translate('settings.pinyinSearchHelp')
            }}</span>
          </span>
          <input
            :checked="enablePinyinSearch"
            class="settings-checkbox"
            type="checkbox"
            aria-describedby="settings-pinyin-help"
            @change="handlePinyinSearchToggle"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { trapFocus } from '@/utils/focus';
import type { ToolTranslate } from './tool-presentation';

defineProps<{
  currentLang: string;
  enablePinyinSearch: boolean;
  translate: ToolTranslate;
}>();

const emit = defineEmits<{
  close: [];
  'language-change': [value: string];
  'pinyin-change': [value: boolean];
}>();

const panel = ref<HTMLElement>();

onMounted(() => {
  nextTick(() => {
    const target = panel.value?.querySelector<HTMLElement>('button, select, input');
    (target || panel.value)?.focus();
  });
});

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('close');
    return;
  }
  if (panel.value) trapFocus(panel.value, event);
};

const handleLanguageChange = (event: Event) => {
  emit('language-change', (event.target as HTMLSelectElement).value);
};

const handlePinyinSearchToggle = (event: Event) => {
  emit('pinyin-change', (event.target as HTMLInputElement).checked);
};
</script>
