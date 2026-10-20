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
          <strong class="reference-tool__item-title">{{ item.name }}</strong>
          <span class="reference-tool__actions">
            <CopyButton
              :value="item.regexStr"
              :label="t('common.copy')"
              class="tool-button--small"
            />
            <button
              class="tool-button tool-button--small"
              type="button"
              :aria-expanded="Boolean(item.isOpened)"
              @click="item.isOpened = !item.isOpened"
            >
              {{ item.isOpened ? t('common.collapse') : t('regex.openTest') }}
            </button>
          </span>
          <p v-if="item.description" class="reference-tool__description">
            {{ item.description }}
          </p>
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
  </section>
</template>

<script setup lang="ts">
import CopyButton from '@/components/Experience/CopyButton.vue';
import { computed, onMounted, ref } from 'vue';
import ajax from '@/api';
import { langManager } from '@/utils/i18n';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import ToolState from '@/components/Experience/ToolState.vue';

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
  max-height: none;
  overflow: visible;
}
.m-regex_item {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
}
.m-regex_item figure {
  min-width: 0;
  margin: 8px 0 0;
}
.m-regex_item .reference-tool__actions {
  flex-wrap: wrap;
}
.m-regex_input {
  display: grid;
  gap: 8px;
}
</style>
