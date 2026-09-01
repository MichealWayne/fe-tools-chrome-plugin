<template>
  <div class="secondary-tool">
    <h3>{{ t('postman.curl.title') }}</h3>
    <div class="curl-grid">
      <section>
        <label for="curl-import">{{ t('postman.curl.import') }}</label>
        <textarea
          id="curl-import"
          v-model="source"
          :placeholder="t('postman.curl.placeholder')"
        ></textarea>
        <button type="button" @click="preview">{{ t('postman.curl.preview') }}</button>
        <p v-if="error" class="tool-error" role="alert">{{ t(`postman.curl.errors.${error}`) }}</p>
        <div v-if="parsed" class="curl-preview">
          <strong>{{ parsed.method }}</strong> {{ parsed.url }}
          <p v-if="warnings.length">
            {{ t('postman.curl.unsupported', { options: warnings.join(', ') }) }}
          </p>
          <button type="button" @click="$emit('apply', parsed)">
            {{ t('postman.curl.apply') }}
          </button>
        </div>
      </section>
      <section>
        <label for="curl-output">{{ t('postman.curl.generate') }}</label>
        <textarea id="curl-output" readonly :value="generated"></textarea>
        <button type="button" @click="copy">{{ t('common.copy') }}</button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { langManager } from '@/utils/i18n';
import type { PostmanRequestConfig } from './types';
import { generateCurl, parseCurl } from './utils/curl';

const props = defineProps<{ request: PostmanRequestConfig }>();
const emit = defineEmits<{
  apply: [request: PostmanRequestConfig];
  feedback: [message: string, tone: 'success' | 'error'];
}>();
const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);
const source = ref('');
const parsed = ref<PostmanRequestConfig | null>(null);
const warnings = ref<string[]>([]);
const error = ref('');
const generated = computed(() => generateCurl(props.request));

const preview = () => {
  const result = parseCurl(source.value);
  parsed.value = result.request;
  warnings.value = result.warnings;
  error.value = result.error || '';
};
const copy = async () => {
  try {
    await navigator.clipboard.writeText(generated.value);
    emit('feedback', t('postman.feedback.curlCopied'), 'success');
  } catch {
    emit('feedback', t('postman.feedback.copyFailed'), 'error');
  }
};
</script>

<style scoped>
.secondary-tool {
  padding: var(--spacing-md);
}
.secondary-tool h3 {
  margin-top: 0;
}
.curl-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}
.curl-grid section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.curl-grid textarea {
  min-height: 150px;
  padding: var(--spacing-md);
  font-family: monospace;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  resize: vertical;
}
.curl-grid button {
  align-self: flex-start;
  padding: 7px 12px;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: var(--color-background-light);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
}
.tool-error {
  color: var(--color-error);
}
@media (max-width: 760px) {
  .curl-grid {
    grid-template-columns: 1fr;
  }
}
</style>
