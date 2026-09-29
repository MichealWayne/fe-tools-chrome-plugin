<template>
  <section class="tailwind-converter">
    <div class="tailwind-converter__panel">
      <div class="tailwind-converter__panel-header">
        <label for="tailwind-input">{{ t('tailwindConverter.inputLabel') }}</label>
        <button
          class="tailwind-converter__header-action"
          type="button"
          :disabled="!input"
          @click="input = ''"
        >
          {{ t('common.clear') }}
        </button>
      </div>
      <textarea
        id="tailwind-input"
        v-model="input"
        :placeholder="t('tailwindConverter.inputPlaceholder')"
        spellcheck="false"
      />
    </div>
    <p class="tailwind-converter__summary">
      {{ t('tailwindConverter.convertedCount', { count: result.convertedCount }) }}
    </p>
    <div class="tailwind-converter__panel">
      <div class="tailwind-converter__panel-header">
        <label for="tailwind-output">{{ t('tailwindConverter.outputLabel') }}</label>
        <button
          class="tailwind-converter__header-action"
          type="button"
          :disabled="!result.css"
          @click="copyCss"
        >
          {{ t('common.copy') }}
        </button>
      </div>
      <textarea
        id="tailwind-output"
        :value="result.css"
        :placeholder="t('tailwindConverter.outputPlaceholder')"
        readonly
        spellcheck="false"
      />
    </div>
    <p v-if="result.unsupported.length" class="tailwind-converter__unsupported" role="status">
      {{ t('tailwindConverter.unsupported') }}: {{ result.unsupported.join(', ') }}
    </p>
    <inline-feedback :feedback="feedback ? { message: feedback, tone: 'info' } : null" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import { langManager } from '@/utils/i18n';
import { convertTailwindClasses } from './convert';

defineOptions({ name: 'TailwindConverter' });

const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);
const input = ref('');
const feedback = ref('');
const result = computed(() => convertTailwindClasses(input.value));

const copyCss = async () => {
  try {
    await navigator.clipboard.writeText(result.value.css);
    feedback.value = t('experience.copied');
  } catch {
    feedback.value = t('tailwindConverter.copyFailed');
  }
};
</script>

<style scoped>
.tailwind-converter {
  --tailwind-border: #e2e9ff;
  --tailwind-panel-border: #e4e9f7;
  --tailwind-muted: #f6f8ff;
  display: grid;
  gap: var(--spacing-sm);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 10px;
  border: 1px solid var(--tailwind-border);
  border-radius: var(--border-radius-xl);
  background: linear-gradient(180deg, var(--color-background-light), #f5f8ff);
  box-shadow: 0 12px 28px rgba(30, 74, 173, 0.12);
}

.tailwind-converter__panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--tailwind-panel-border);
  border-radius: var(--border-radius-xl);
  background: var(--color-background-light);
  box-shadow: 0 6px 14px rgba(28, 63, 124, 0.06);
}

.tailwind-converter__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  min-height: 36px;
  padding: 6px 10px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--tailwind-border);
  background: var(--tailwind-muted);
}

.tailwind-converter__panel-header label {
  color: #1f2a44;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
}

.tailwind-converter__header-action {
  min-height: 28px;
  padding: 4px 6px;
  border: 0;
  border-radius: var(--border-radius-sm);
  color: var(--color-primary);
  background: transparent;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.tailwind-converter__header-action:hover:not(:disabled) {
  background: var(--color-primary-surface);
}

.tailwind-converter__header-action:disabled {
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

.tailwind-converter textarea {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 110px;
  min-height: 96px;
  padding: 10px;
  border: 0;
  resize: vertical;
  color: #2b3a55;
  background: var(--color-background-light);
  font-family: var(--font-family-mono);
  font-size: 13px;
  line-height: 1.5;
}

.tailwind-converter textarea:focus-visible {
  outline: 2px solid var(--color-primary-focus-ring);
  outline-offset: -2px;
}

#tailwind-output {
  height: 130px;
  min-height: 110px;
}

.tailwind-converter__summary {
  margin: 0;
  padding: 5px 8px;
  border-left: 3px solid var(--color-primary);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-secondary);
  background: var(--tailwind-muted);
  font-size: 12px;
}

.tailwind-converter__unsupported {
  margin: 0;
  padding: 8px 10px;
  border-radius: var(--border-radius-md);
  overflow-wrap: anywhere;
  color: var(--color-warning-foreground);
  background: var(--color-warning-surface);
  font-size: 12px;
}
</style>
