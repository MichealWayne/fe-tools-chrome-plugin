<template>
  <section class="reference-tool">
    <label class="reference-tool__search">
      <span class="reference-tool__label">{{ t('utils.searchLabel') }}</span>
      <input
        v-model="keywords"
        class="m-s_input g-fs16"
        :placeholder="t('utils.searchPlaceholder')"
        autocomplete="off"
        type="search"
      />
    </label>
    <tool-state v-if="loading" state="loading" :message="t('experience.loading')" />
    <tool-state
      v-else-if="loadError"
      state="error"
      :message="loadError"
      :action-label="t('experience.retry')"
      @action="loadUtils"
    />
    <tool-state
      v-else-if="keywords && !filteredFunctions.length"
      state="empty"
      :message="t('experience.noResults')"
    />
    <p v-else class="reference-tool__count">
      {{ t('experience.resultCount', { count: filteredFunctions.length || moduleList.length }) }}
    </p>

    <ul v-if="keywords" class="reference-tool__list">
      <li v-for="item in filteredFunctions" :key="item.query">
        <button class="reference-tool__result" type="button" @click="toUtilFuncDoc(item.query)">
          <strong>{{ item.name }}</strong
          ><span>{{ item.label }} · {{ t('experience.external') }}</span>
        </button>
      </li>
    </ul>
    <ul v-else class="m-module-list">
      <li v-for="item in moduleList" :key="item.name">
        <button type="button" @click="toUtilFuncDoc(item.name)">{{ item.name }}</button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ajax from '@/api';
import { jumpAction } from '@/utils/chrome';
import { langManager } from '@/utils/i18n';
import ToolState from '@/components/Experience/ToolState.vue';

type UtilItem = { name: string; label: string; query: string };
const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);
const keywords = ref('');
const moduleList = ref<Array<{ name: string }>>([]);
const funcsList = ref<UtilItem[]>([]);
const loading = ref(false);
const loadError = ref('');

const filteredFunctions = computed(() => {
  const keyword = keywords.value.trim().toLowerCase();
  if (!keyword) return [];
  return funcsList.value.filter(item =>
    `${item.name} ${item.label} ${item.query}`.toLowerCase().includes(keyword)
  );
});

const handleList = (list: unknown) => {
  const names = new Set<string>();
  if (Array.isArray(list)) {
    list.forEach(item => {
      if (typeof item === 'string') names.add(item);
    });
  } else if (list && typeof list === 'object') {
    Object.values(list as Record<string, { query?: string }>).forEach(item => {
      if (item?.query) names.add(item.query);
    });
  }
  moduleList.value = Array.from(names).map(name => ({ name }));
  funcsList.value = Array.from(names).map(query => {
    const parts = query.split('.');
    return { query, label: parts[0], name: parts[parts.length - 1] };
  });
};

const loadUtils = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await ajax.getUtilFuncs();
    handleList(data.list || data.data);
  } catch (error) {
    loadError.value = (error as Error).message || t('utils.loadFailed');
  } finally {
    loading.value = false;
  }
};

const toUtilFuncDoc = (query: string) =>
  jumpAction(`https://blog.michealwayne.cn/fe-tools/stable/?page=${query}`);

onMounted(loadUtils);
</script>

<style lang="less" scoped>
.m-module-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
}
.m-module-list button {
  width: 100%;
  padding: 8px;
  text-align: left;
  word-break: break-all;
}
</style>
