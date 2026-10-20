<template>
  <section class="tailwind-converter">
    <div class="tailwind-converter__panel">
      <div class="tailwind-converter__panel-header">
        <label for="tailwind-input">{{ t('tailwindConverter.inputLabel') }}</label>
        <button
          class="tool-button tool-button--text tailwind-converter__header-action"
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
    <div class="tailwind-converter__panel">
      <div class="tailwind-converter__panel-header">
        <label for="tailwind-output">{{ t('tailwindConverter.outputLabel') }}</label>
        <div class="tailwind-converter__header-meta">
          <span class="tailwind-converter__summary">
            {{ t('tailwindConverter.convertedCount', { count: result.convertedCount }) }}
          </span>
          <CopyButton
            :value="result.css"
            :label="t('common.copy')"
            class="tool-button--text tailwind-converter__header-action"
          />
        </div>
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
  </section>
</template>

<script setup lang="ts">
import CopyButton from '@/components/Experience/CopyButton.vue';
import { computed, ref } from 'vue';
import { langManager } from '@/utils/i18n';
import { convertTailwindClasses } from './convert';
import { useTextDraft } from '@/composables/useTextDraft';

defineOptions({ name: 'TailwindConverter' });

const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);
const input = ref('');
useTextDraft('tailwind-input', input);
const result = computed(() => convertTailwindClasses(input.value));
</script>

<style scoped>
.tailwind-converter {
  --tailwind-border: var(--color-border-light);
  --tailwind-panel-border: var(--color-border-light);
  --tailwind-muted: var(--color-background-dark);
  display: grid;
  gap: var(--spacing-sm);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 10px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.tailwind-converter__panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--tailwind-panel-border);
  border-radius: var(--border-radius-xl);
  background: var(--color-background-light);
  box-shadow: none;
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
  color: var(--color-text-primary);
  font-size: var(--font-size-control);
  font-weight: var(--font-weight-semibold);
}

.tailwind-converter__header-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tailwind-converter textarea {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: clamp(96px, calc((100dvh - 230px) / 2), 180px);
  min-height: 96px;
  padding: 10px;
  border: 0;
  resize: vertical;
  color: var(--color-text-primary);
  background: var(--color-background-light);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-control);
  line-height: 1.5;
}

.tailwind-converter textarea:focus-visible {
  outline-offset: -2px;
}

#tailwind-output {
  height: clamp(110px, calc((100dvh - 210px) / 2), 200px);
  min-height: 110px;
}

.tailwind-converter__summary {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.tailwind-converter__unsupported {
  margin: 0;
  padding: 8px 10px;
  border-radius: var(--border-radius-md);
  overflow-wrap: anywhere;
  color: var(--color-warning-foreground);
  background: var(--color-warning-surface);
  font-size: var(--font-size-xs);
}
</style>
