<template>
  <section class="reference-tool m-regex">
    <label class="reference-tool__search">
      <span class="reference-tool__label">{{ t('regex.filterLabel') }}</span>
      <input v-model="filterTxt" class="u-input" type="search" :placeholder="t('regex.filter')" />
    </label>
    <tool-state v-if="loading" state="loading" :message="t('experience.loading')" />
    <tool-state
      v-else-if="loadError"
      state="error"
      :message="loadError"
      :action-label="t('experience.retry')"
      @action="loadRegex"
    />
    <tool-state
      v-else-if="filterTxt && !filteredRegex.length"
      state="empty"
      :message="t('experience.noResults')"
    />
    <p v-else class="reference-tool__count">
      {{ t('experience.resultCount', { count: filteredRegex.length }) }}
    </p>

    <ul class="reference-tool__list">
      <li v-for="item in filteredRegex" :key="item.regexStr" class="m-regex_item">
        <div class="reference-tool__item-header">
          <span>
            <strong>{{ item.name }}</strong>
            <span v-if="item.description">（{{ item.description }}）</span>
          </span>
          <span class="reference-tool__actions">
            <button type="button" @click="copyRegex(item)">{{ t('common.copy') }}</button>
            <button
              type="button"
              :aria-expanded="Boolean(item.isOpened)"
              @click="item.isOpened = !item.isOpened"
            >
              {{ item.isOpened ? t('common.collapse') : t('regex.test') }}
            </button>
          </span>
        </div>
        <figure>
          <pre :class="$style.pre">{{ item.regexStr }}</pre>
        </figure>
        <div v-if="item.isOpened" class="m-regex_input">
          <label>
            <span class="reference-tool__label">{{ t('regex.inputTest') }}</span>
            <input v-model="item.testValue" class="u-input" type="text" />
          </label>
          <button class="u-btn_il" s-color="blue" @click="runTest(item)">
            {{ t('regex.test') }}
          </button>
          <inline-feedback
            :feedback="
              item.testError
                ? { message: item.testError, tone: 'validation' }
                : item.testResult === undefined
                  ? null
                  : {
                      message: `${t('regex.result')}：${item.testResult}`,
                      tone: item.testResult ? 'success' : 'warning',
                    }
            "
          />
        </div>
      </li>
    </ul>
    <inline-feedback :feedback="feedback" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ajax from '@/api';
import { langManager } from '@/utils/i18n';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import ToolState from '@/components/Experience/ToolState.vue';
import type { InlineFeedbackMessage } from '@/types/experience';

type RegexItem = {
  name: string;
  description?: string;
  regexStr: string;
  isOpened?: boolean;
  testValue?: string;
  testResult?: boolean;
  testError?: string;
};

const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);
const filterTxt = ref('');
const regexList = ref<RegexItem[]>([]);
const loading = ref(false);
const loadError = ref('');
const feedback = ref<InlineFeedbackMessage | null>(null);

const filteredRegex = computed(() => {
  const keyword = filterTxt.value.trim().toLowerCase();
  if (!keyword) return regexList.value;
  return regexList.value.filter(item =>
    `${item.name} ${item.description || ''} ${item.regexStr}`.toLowerCase().includes(keyword)
  );
});

const loadRegex = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await ajax.getRegex();
    regexList.value = (Array.isArray(data.list) ? data.list : []).map(item => ({
      ...(item as RegexItem),
      isOpened: false,
      testValue: '',
    }));
  } catch (error) {
    loadError.value = (error as Error).message || t('regex.loadFailed');
  } finally {
    loading.value = false;
  }
};

const runTest = (item: RegexItem) => {
  item.testError = '';
  try {
    item.testResult = new RegExp(item.regexStr).test(item.testValue || '');
  } catch (error) {
    item.testResult = undefined;
    item.testError = (error as Error).message;
  }
};

const copyRegex = async (item: RegexItem) => {
  try {
    await navigator.clipboard.writeText(item.regexStr);
    feedback.value = { message: t('experience.copied'), tone: 'success' };
  } catch (error) {
    feedback.value = { message: (error as Error).message, tone: 'error' };
  }
};

onMounted(loadRegex);
</script>

<style lang="less" module>
.pre {
  padding: 12px;
  overflow: auto;
  font-size: 85%;
  background: #f6f8fa;
  border-radius: 6px;
}
</style>

<style lang="less" scoped>
.m-regex {
  max-height: 480px;
  overflow-y: auto;
}
.m-regex_item {
  padding: 12px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
}
.m-regex_input {
  display: grid;
  gap: 8px;
}
</style>
