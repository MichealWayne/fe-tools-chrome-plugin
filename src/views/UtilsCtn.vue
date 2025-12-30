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
        <span v-html="item.name"></span>
      </li>
    </ul>

    <ul class="m-module-list">
      <li v-for="(item, index) in moduleList" :key="index" @click="toUtilFuncDoc(item.name)">
        {{ item.name }}
      </li>
    </ul>

    <p class="u-link g-mt30 f-tc g-fs14" s-cr_blue @click.stop="back">
      {{ t('common.backHome') }}
    </p>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { langManager } from '@/utils/i18n';

import { AnyFunc, AnyObj } from '@/types';
import { jumpAction } from '@/utils/chrome';
import ajax from '@/api';

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
        .then((data: any) => {
          if (data && (data.success || data.list || data.data || Array.isArray(data))) {
            this.handleList(data.list || data.data || data);
          }
        })
        .catch((error: any) => {
          console.error('Failed to load util functions:', error);
        });
    }
  },

  methods: {
    translate(key: string) {
      return langManager.t(key);
    },
    /**
     * 翻译方法
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

    handleList(list: any) {
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
