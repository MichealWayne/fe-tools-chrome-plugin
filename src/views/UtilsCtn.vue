<!--
 * @author Wayne
 * @Date 2023-07-25 19:28:57
 * @LastEditTime 2023-08-27 10:43:10
-->
<template>
  <section class="m-moo">
    <section>
      <p class="u-c-middle g-mt50">
        <input
          id="search"
          v-model="keywords"
          class="m-s_input g-fs16 u-w300"
          placeholder="请输入方法名或模块名"
          autocomplete="off"
          type="text"
          autofocus
          @input="handleInputInput"
          @blur="handleInputBlur"
        />
        <button class="u-btn_il j-search g-fs18 g-ml10" s-color="blue" @click="setSearchResult">
          Search
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
      <li v-for="(item, index) in moduleList" :key="index" @click="toUtilFuncDoc(item)">
        {{ item }}
      </li>
    </ul>

    <p class="u-link g-mt30 f-tc g-fs14" s-cr_blue @click.stop="back">返回主页</p>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { AnyFunc } from '@/types';
import { jumpAction } from '@/utils/chrome';
import ajax from '@/api';

type ComponentDataTypes = {
  keywords: string;
  resultList: any[];
  moduleList: any[];
  funcsList: any[];
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
    ajax.getUtilFuncs().then((data: any) => {
      this.handleList(data);
    });
  },

  methods: {
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
      const ModuleSet = new Set();
      Object.keys(list).forEach(key => {
        const item = list[key];
        const { query = '' } = item;
        const label = query;
        if (label) ModuleSet.add(label);
      });

      this.moduleList = Array.from(ModuleSet);
      this.funcsList = Array.from(ModuleSet).map(item => {
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
        {
          css: 's-simple',
          moo: 's-red',
          'moo-f': 's-blue',
        } as any
      )[type];
    },

    setSearchResult() {
      const keywords = this.keywords.toLowerCase();

      const { funcsList } = this;
      this.resultList = funcsList.filter(
        item => item.name.includes(keywords) || item.label.includes(keywords)
      );
    },

    handleResultClick(item: any) {
      this.toUtilFuncDoc(item.query);
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
