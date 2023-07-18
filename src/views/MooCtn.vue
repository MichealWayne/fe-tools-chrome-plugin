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
import { jumpAction } from '@/utils/chrome';
import ajax from '@/api/ajax';

export default defineComponent({
  name: 'MooCtn',

  props: {
    back: Function,
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
      resultList: [],

      styleList: [], // css属性列表
      mooColorList: [], // moo-css 颜色列表
      mooFuncList: [], // moo-css 方法列表
      mooClassList: [], // moo-css 样式列表
    };
  },

  mounted() {
    ajax.getMooCSS().then(data => {
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

    setSearchResult() {
      let keywords = this.keywords.toLowerCase();

      let resultList = [];
      if (keywords && keywords.length > 2) {
        // 属性
        let styleList = this.styleList || [];
        for (let i = 0, len = styleList.length; i < len; i++) {
          let item = styleList[i];
          if (
            ~item.name.indexOf(keywords) ||
            ~item.desc.indexOf(keywords) ||
            ~item.type.indexOf(keywords)
          ) {
            resultList.push({
              label: 'CSS ' + item.ver,
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
        let mooColorList = this.mooColorList || [];
        for (let i = 0, len = mooColorList.length; i < len; i++) {
          let item = mooColorList[i];
          if (~item.name.indexOf(keywords) || ~item.desc.indexOf(keywords)) {
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
        let mooFuncList = this.mooFuncList || [];
        for (let i = 0, len = mooFuncList.length; i < len; i++) {
          let item = mooFuncList[i];
          if (~item.name.indexOf(keywords) || ~item.desc.indexOf(keywords)) {
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
        let mooClassList = this.mooClassList || [];
        for (let i = 0, len = mooClassList.length; i < len; i++) {
          let item = mooClassList[i];
          if (
            ~item.name.indexOf(keywords) ||
            ~item.desc.indexOf(keywords) ||
            ~item.val.indexOf(keywords)
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
      let arr = [];
      for (let i in list) {
        let name = list[i].name;
        let child = list[i].children;

        for (let i = 0, len = child.length; i < len; i++) {
          let item = child[i];
          arr.push({
            type: name,
            name: item['属性'],
            desc: item['说明'],
            ver: item['CSS版本'],
          });
        }
      }
      return arr;
    },
    // @todo
    handleMooColorList(list: any[]) {
      let arr = [];
      for (let i = 0, len = list.length; i < len; i++) {
        let item = list[i];
        arr.push({
          name: item['变量'] + ' ' + item['十六进制色值'],
          desc: item['说明'],
          show: item['效果'],
        });
      }
      return arr;
    },
    // @todo
    handleMooFuncList(list: any[]) {
      let arr = [];
      for (let i = 0, len = list.length; i < len; i++) {
        let item = list[i];
        arr.push({
          name: item['方法名'] + '(' + item['参数'] + ')',
          desc: item['说明'],
          place: item['平台'],
        });
      }
      return arr;
    },
    // @todo
    handleMooClassList(list: any[]) {
      let arr = [];
      for (let i in list) {
        let name = list[i].name;
        let child = list[i].children;

        for (let i = 0, len = child.length; i < len; i++) {
          let item = child[i];
          if (!item['类/属性名'] || !item['属性']) continue;
          arr.push({
            type: name,
            name: item['类/属性名'],
            desc: item['说明'],
            val: item['属性'],
          });
        }
      }
      return arr;
    },

    // @todo
    handleList(data: any) {
      for (let i in data) {
        let name = data[i].name;
        if (name === '样式模块词典') {
          this.styleList = Object.freeze(this.handleStyleList(data[i].children)) as any[];
        } else if (name === 'moo-css-base词典') {
          for (let j in data[i].children) {
            let name = data[i].children[j].name;
            if (name === '颜色') {
              this.mooColorList = Object.freeze(
                this.handleMooColorList(data[i].children[j].children)
              );
            } else if (name === '方法') {
              this.mooFuncList = Object.freeze(
                this.handleMooFuncList(data[i].children[j].children)
              );
            } else if (name === '样式') {
              this.mooClassList = Object.freeze(
                this.handleMooClassList(data[i].children[j].children)
              );
            }
          }
        }
      }
    },
  },
});
</script>
