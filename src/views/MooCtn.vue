<template>
  <section class="m-moo">
    <h1 :class="{ 'z-fold': logoFold }" class="f-tc j-logo_ctn f-ovhidden">
      <img
        class="m-logo u-link"
        src="https://blog.michealwayne.cn/Moo-CSS/docs/logo.png"
        alt="feTools icon"
        @click="toMooHome"
      />
    </h1>
    <section>
      <p class="u-c-middle g-mt50">
        <input
          id="search"
          v-model="keywords"
          class="m-s_input g-fs16 u-w300"
          placeholder="请输入模块或样式属性"
          autocomplete="off"
          type="text"
          autofocus
          @focus="handleInputFocus"
          @blur="handleInputBlur"
          @input="handleInputInput"
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
    <p class="u-link g-mt50 f-tc g-fs14" s-cr_blue @click.stop="back">返回主页</p>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { AnyFunc } from '@/types';
import { jumpAction } from '@/utils/chrome';
import ajax from '@/api';

export default defineComponent({
  name: 'MooCtn',

  props: {
    back: {
      type: Function as AnyFunc,
      default: () => ({}),
    },
  },

  data(): {
    keywords: string;
    logoFold: boolean;
    resultList: any[];
    styleList: any[];
    mooColorList: any[];
    mooFuncList: any[];
    mooClassList: any[];
  } {
    return {
      keywords: '',
      logoFold: false,

      // 搜索结果列表
      resultList: [],

      // css属性列表
      styleList: [],

      // moo-css 颜色列表
      mooColorList: [],

      // moo-css 方法列表
      mooFuncList: [],

      // moo-css 样式列表
      mooClassList: [],
    };
  },

  mounted() {
    ajax.getMooCSS().then((data: any) => {
      this.handleList(data.list);
    });
  },
  methods: {
    toMooHome() {
      jumpAction('https://blog.michealwayne.cn/Moo-CSS/docs/');
    },
    handleInputFocus() {
      if (this.keywords) this.logoFold = true;
    },
    handleInputBlur() {
      if (!this.keywords) {
        this.resultList = [];
        this.logoFold = false;
      }
    },
    handleInputInput() {
      if (this.keywords) {
        this.logoFold = true;
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
    // @todo
    handleResultClick(item: any) {
      jumpAction(item.link);
    },

    // eslint-disable-next-line complexity
    setSearchResult() {
      const keywords = this.keywords.toLowerCase();

      const resultList = [];
      if (keywords?.length > 1) {
        // 属性
        const styleList = this.styleList || [];

        for (let i = 0; i < styleList.length; i++) {
          const item = styleList[i];
          if (
            item.name.includes(keywords) ||
            item.desc.includes(keywords) ||
            item.type.includes(keywords)
          ) {
            resultList.push({
              label: `CSS ${item.ver}`,
              color: 'orange',
              name:
                item.name.replace(keywords, `<strong>${keywords}</strong>`) +
                `: <em s-ft_sub_>(${item.type})${item.desc}.</em>`,
              link: `https://developer.mozilla.org/zh-CN/docs/Web/CSS/${item.name
                .toLowerCase()
                .replace(/\s/g, '')}`, // not useful: `http://css.cuishifeng.cn/${item.name.toLowerCase().replace(/\s/g, '')}.html`
            });
          }
        }

        // 颜色
        const mooColorList = this.mooColorList || [];

        for (let i = 0; i < mooColorList.length; i++) {
          const item = mooColorList[i];
          if (item.name.includes(keywords) || item.desc.includes(keywords)) {
            resultList.unshift({
              label: 'moo',
              color: 'red',
              name:
                item.show +
                ' (变量)' +
                item.name.replace(keywords, `<strong>${keywords}</strong>`) +
                `: <em s-ft_sub_>${item.desc}</em>`,
              link: 'https://blog.michealwayne.cn/Moo-CSS/docs/nameDictionary/#%E9%A2%9C%E8%89%B2',
            });
          }
        }

        // 方法
        const mooFuncList = this.mooFuncList || [];
        for (let i = 0; i < mooFuncList.length; i++) {
          const item = mooFuncList[i];
          if (item.name.includes(keywords) || item.desc.includes(keywords)) {
            resultList.unshift({
              label: 'moo-f',
              color: 'blue',
              name:
                '(方法)' +
                item.name.replace(keywords, `<strong>${keywords}</strong>`) +
                `: <em s-ft_sub_>${item.place}, ${item.desc}</em>`,
              link: 'httpa://blog.michealwayne.cn/Moo-CSS/docs/nameDictionary/#%E6%96%B9%E6%B3%95',
            });
          }
        }

        // 样式
        const mooClassList = this.mooClassList || [];
        for (let i = 0; i < mooClassList.length; i++) {
          const item = mooClassList[i];
          if (
            item.name.includes(keywords) ||
            item.desc.includes(keywords) ||
            item.val.includes(keywords)
          ) {
            resultList.push({
              label: 'moo',
              color: 'red',
              name:
                item.name.replace(keywords, `<strong>${keywords}</strong>`) +
                `: <em s-ft_sub_>${item.desc}.(${item.val})</em>`,
              link: 'http://blog.michealwayne.cn/Moo-CSS/docs/nameDictionary/#%E6%A0%B7%E5%BC%8F',
            });
          }
        }
      }
      this.resultList = resultList;
    },

    // @todo
    handleStyleList(list: any[]) {
      const arr: Array<{
        type: string;
        name: string;
        desc: string;
        ver: string;
      }> = [];

      Object.values(list).forEach(item => {
        const { name, children } = item;

        children.forEach((subItem: any) => {
          arr.push({
            type: name,
            name: subItem['属性'],
            desc: subItem['说明'],
            ver: subItem['CSS版本'],
          });
        });
      });

      return arr;
    },
    // @todo
    handleMooColorList(list: any[]) {
      return list.map(item => ({
        name: `${item['变量']} ${item['十六进制色值']}`,
        desc: item['说明'],
        show: item['效果'],
      }));
    },
    // @todo
    handleMooFuncList(list: any[]) {
      return list.map(item => ({
        name: item['方法名'] + '(' + item['参数'] + ')',
        desc: item['说明'],
        place: item['平台'],
      }));
    },
    // @todo
    handleMooClassList(list: any[]) {
      const arr: Array<{
        type: string;
        name: string;
        desc: string;
        val: string;
      }> = [];

      Object.values(list).forEach(item => {
        const { name, children } = item;
        children.forEach((subItem: any) => {
          if (!subItem['类/属性名'] || !subItem['属性']) return;

          arr.push({
            type: name,
            name: subItem['类/属性名'],
            desc: subItem['说明'],
            val: subItem['属性'],
          });
        });
      });
      return arr;
    },

    // @todo
    handleList(data: any) {
      Object.values(data).forEach(item => {
        const { name, children } = item;
        if (name === '样式模块词典') {
          this.styleList = Object.freeze(this.handleStyleList(children)) as any[];
          return;
        }
        if (name === 'moo-css-base词典') {
          children.forEach((subItem: any) => {
            switch (subItem.name) {
              case '颜色':
                this.mooColorList = Object.freeze(
                  this.handleMooColorList(subItem.children)
                ) as any[];
                break;
              case '方法':
                this.mooFuncList = Object.freeze(this.handleMooFuncList(subItem.children)) as any[];
                break;
              case '样式':
                this.mooClassList = Object.freeze(
                  this.handleMooClassList(subItem.children)
                ) as any[];
                break;
              default:
                console.log(`unsupport type name: ${subItem}`);
            }
          });
        }
      });
    },
  },
});
</script>
