<template>
  <section class="m-moo">
    <section>
      <p class="u-c-middle g-mt50">
        <input
          id="search"
          v-model="keywords"
          class="m-s_input g-fs16 u-w300"
          :placeholder="t('utils.searchPlaceholder')"
          autocomplete="off"
          type="text"
          autofocus
          @input="handleInputInput"
          @blur="handleInputBlur"
        />
        <button class="u-btn_il j-search g-fs18 g-ml10" s-color="blue" @click="setSearchResult">
          {{ t('common.search') }}
        </button>
      </p>
    </section>

    <ul class="m-searchList u-w420 j-searchList g-center">
      <li v-for="(item, index) in resultList" :key="index" @click="handleResultClick(item)">
        <em v-if="item.label" class="u-icon_il icon-label" :class="getResultLabel(item.label)">{{
          item.label
        }}</em>
        <span v-html="getResultName(item)"></span>
      </li>
    </ul>

    <ul class="m-module-list">
      <li v-for="(item, index) in moduleList" :key="index" @click="toUtilFuncDoc(item.name)">
        {{ item.name }}
      </li>
    </ul>

  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { langManager } from '@/utils/i18n';

import { AnyFunc, AnyObj } from '@/types';
import { jumpAction } from '@/utils/chrome';
import ajax from '@/api';
import { sanitizeInlineMarkup } from '@/utils/sanitize';

type ComponentDataTypes = {
  keywords: string;
  resultList: AnyObj[];
  moduleList: AnyObj[];
  funcsList: AnyObj[];
};
export default defineComponent({
  name: 'UtilsCtn',

  props: {
    back: {
      type: Function as AnyFunc,
      default: () => ({}),
    },
  },

  data(): ComponentDataTypes {
    return {
      keywords: '',
      moduleList: [],
      resultList: [],
      funcsList: [],
    };
  },

  mounted() {
    if (ajax && ajax.getUtilFuncs) {
      ajax
        .getUtilFuncs()
        .then((data: { success?: boolean; list?: unknown; data?: unknown } | unknown[]) => {
          if (data && (data.success || data.list || data.data || Array.isArray(data))) {
            const payload =
              'list' in (data as Record<string, unknown>) ||
              'data' in (data as Record<string, unknown>)
                ? ((data as Record<string, unknown>).list ||
                    (data as Record<string, unknown>).data)
                : data;
            this.handleList(payload);
          }
        })
        .catch((error: unknown) => {
          console.error('Failed to load util functions:', error);
        });
    }
  },

  methods: {
    translate(key: string) {
      return langManager.t(key);
    },
    /**
     * Translate a key using the shared language manager.
     */
    t(key: string) {
      return langManager.t(key);
    },

    toUtilFuncsHome() {
      jumpAction('https://blog.michealwayne.cn/fe-tools/stable/');
    },

    toUtilFuncDoc(search: string) {
      if (!search) {
        this.toUtilFuncsHome();
      } else {
        jumpAction(`https://blog.michealwayne.cn/fe-tools/stable/?page=${search}`);
      }
    },

    handleList(list: unknown) {
      if (!list) return;

      const ModuleSet = new Set<string>();

      if (Array.isArray(list)) {
        list.forEach((item: unknown) => {
          if (typeof item === 'string') {
            ModuleSet.add(item);
          }
        });
      } else if (typeof list === 'object') {
        Object.keys(list).forEach(key => {
          const item = list[key];
          const query = item?.query || '';
          if (query) ModuleSet.add(query);
        });
      }

      this.moduleList = Array.from(ModuleSet).map(item => ({ name: item }));
      this.funcsList = Array.from(ModuleSet).map((item: string) => {
        const infos = item.split('.');
        const label = infos[0];
        const name = infos[infos.length - 1];
        return {
          name,
          label,
          query: item,
        };
      });
    },

    handleInputBlur() {
      if (!this.keywords) {
        this.resultList = [];
      }
    },

    handleInputInput() {
      if (this.keywords) {
        this.setSearchResult();
      }
    },

    getResultLabel(type: string) {
      return (
        (
          {
            css: 's-simple',
            moo: 's-red',
            'moo-f': 's-blue',
          } as Record<string, string>
        )[type] || ''
      );
    },

    /**
     * Sanitize search result markup before rendering.
     * @param item - Search result entry.
     */
    getResultName(item: AnyObj) {
      return sanitizeInlineMarkup((item?.name as string) || '');
    },

    setSearchResult() {
      const keywords = this.keywords.toLowerCase();

      const { funcsList } = this;
      this.resultList = funcsList.filter((item: AnyObj) => {
        const name = (item.name as string) || '';
        const label = (item.label as string) || '';
        return name.includes(keywords) || label.includes(keywords);
      });
    },

    handleResultClick(item: AnyObj) {
      this.toUtilFuncDoc(item.query as string);
    },
  },
});
</script>

<style lang="less">
.m-module-list {
  display: flex;
  flex-wrap: wrap;

  max-height: 300px;
  overflow-y: auto;

  li {
    padding: 12px 5px;
    width: 85px;
    // height: 30px;
    font-size: 11px;
    line-height: 15px;
    text-align: left;
    word-break: break-all;
    color: #323232;
    cursor: pointer;

    overflow: auto;

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
