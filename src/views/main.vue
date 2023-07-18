<!--
    主页面
-->
<template>
  <section class="m-ctn u-pt20 f-ovhidden">
    <div v-show="!showCompName.includes('Ctn')" class="m-main_ctn">
      <div :class="{ 'f-blur': showCompName }">
        <h1 :class="{ 'z-fold': logoFold }" class="f-tc j-logo_ctn f-ovhidden">
          <img class="m-logo u-link" src="/icon.png" alt="icon" @click="toHome" />
        </h1>
        <section>
          <p class="u-c-middle g-mt50">
            <input
              id="search"
              v-model="keywords"
              class="m-s_input g-fs16 u-w300"
              placeholder="请输入关键词或二维码生成地址"
              autocomplete="off"
              type="text"
              autofocus
              @focus="handleInputFocus"
              @blur="handleInputBlur"
              @input="handleInputInput"
            />
            <button s-color="blue" class="u-btn_il j-search g-fs18 g-ml10" @click="setSearchResult">
              Search
            </button>
          </p>
          <ul class="m-searchList u-w420 j-searchList g-center">
            <li v-for="(item, index) in resultList" :key="index" @click="handleResultClick(item)">
              <em
                v-if="item.label"
                class="u-icon_il icon-label"
                :class="getResultLabel(item.label)"
                >{{ item.label }}</em
              >
              <span v-html="getResultText(item)"></span>
            </li>
          </ul>
        </section>
        <section class="g-mt50 g-center">
          <ul class="m-others g-fs14 u-pt10 u-j-middle">
            <li
              class="f-tc"
              title="输入框地址URL或当前页面URL生成二维码"
              @click="showCompName = 'QRCode'"
            >
              <em class="u-icon iconfont icon-erweima g-fs36"></em>
              <span class="g-fs12">生成二维码</span>
            </li>
            <li
              class="f-tc"
              title="本地或在线图片压缩/转为base64字符串"
              @click="showCompName = 'ImageCompressor'"
            >
              <em class="u-icon iconfont icon-compress-file g-fs36"></em>
              <span class="g-fs12">图片压缩/base64</span>
            </li>
            <li class="f-tc" title="rgb/hxb/hex色值换算" @click="showCompName = 'ColorPass'">
              <em class="u-icon iconfont icon-chanyexietong g-fs36"></em>
              <span class="g-fs12">色值换算</span>
            </li>
            <li class="f-tc" title="简版PostMan" @click="toPostMan">
              <em class="u-icon icon-postman g-center g-fs36"></em>
              <span class="g-fs12">PostMan</span>
            </li>
          </ul>
          <ul class="m-others g-fs14 u-pt30 u-j-middle">
            <li class="f-tc" title="计算器，px/rem/vw换算" @click="showCompName = 'UnitCalculator'">
              <em class="u-icon iconfont icon-calc g-center g-fs36"></em>
              <span class="g-fs12">单位计算器</span>
            </li>
            <li class="f-tc" title="快速搜索Moo-CSS模块/方法" @click="showCompName = 'MooCtn'">
              <em class="u-icon iconfont icon-moo g-center g-fs36"></em>
              <span class="g-fs12">Moo-CSS</span>
            </li>
            <li class="f-tc" title="快速中英文翻译" @click="showCompName = 'LangTranslator'">
              <em class="u-icon iconfont icon-fanyi g-center g-fs36"></em>
              <span class="g-fs12">快速翻译</span>
            </li>
            <li class="f-tc" title="常用正则表达式查询" @click="showCompName = 'RegexCtn'">
              <em class="u-icon iconfont icon-regex g-center g-fs36"></em>
              <span class="g-fs12">正则查询</span>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <!-- 各组件展示 -->
    <div
      v-show="showCompName"
      :class="!showCompName.includes('Ctn') ? 'u-fix_ctn u-c-middle j-fixctn' : 'm-moo_ctn'"
      @click="hideFixCtn"
    >
      <component
        :is="showCompName"
        v-if="showCompName"
        :keywords="keywords"
        :back="() => (showCompName = '')"
      />
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { getUrlParam } from '@/utils';
import { getMarkTree, jumpAction } from '@/utils/chrome';
import ajax from '@/api/ajax';

import MooCtn from './MooCtn.vue';
import RegexCtn from './RegexCtn.vue';

import { DEFAULT_SEARCH_LIST } from '@/constant';

import CompMap from '@/components/';

export default defineComponent({
  name: 'MainContent',

  components: {
    ...CompMap,
    MooCtn,
    RegexCtn,
  },

  data(): {
    keywords: string;
    markList: Array<{ [key: string]: unknown }>;
    logoFold: string | boolean;

    showCompName: string;

    resultList: Array<{
      link: string;
      name: string;
      label?: string;
      color?: string;
    }>;
    feToolsList: Array<{ name: string; link: string; desc: string; target: any }>;
  } {
    return {
      keywords: '',
      markList: [], // local marks list
      logoFold: '', // logo fold

      showCompName: getUrlParam('search') ? 'QRCode' : '',

      resultList: [], // search result list
      feToolsList: [], // fe tools list
    };
  },

  beforeMount() {
    getMarkTree(list => (this.markList = list));
    ajax
      .getFeTools()
      .then((data: any) => {
        let list = this.handleFEToolsList(data.list);
        this.feToolsList = Object.freeze(list);

        let _msg = getUrlParam('message');
        if (_msg) {
          this.keywords = _msg;
          this.setSearchResult();
        }
      })
      .catch(e => {
        alert(e && e.message);
      });
  },

  methods: {
    toPostMan() {
      jumpAction('index.html?type=postman');
    },

    toHome() {
      jumpAction('https://github.com/MichealWayne/fe-tools');
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

    handleResultClick(item) {
      if (item.type === 'qr') {
        // qr code
        this.showCompName = 'QRCode';
      } else {
        jumpAction(item.link);
      }
    },
    getResultText(item) {
      if (item.type === 'qr') {
        return '生成二维码';
      } else {
        return item.name;
      }
    },
    getResultLabel(type) {
      return {
        tools: 's-simple',
        mark: 's-red',
      }[type];
    },

    handleFEToolsList(list): Array<{
      name: string;
      link: string;
      desc: string;
      target: any;
    }> {
      let handleList = data => {
        let result = [];
        if (Array.isArray(data)) {
          for (let i = 0, len = data.length; i < len; i++) {
            let item = data[i];
            if (item.link && item.name)
              result.push({
                name: item.name,
                link: item.link,
                desc: item.desc,
                target: item.target,
              });
            if (item.children && item.children.length) {
              result.push(...handleList(item.children));
            }
          }
        } else if (data.link && data.name) {
          result.push({
            name: data.name,
            link: data.link,
            desc: data.desc,
            target: data.target,
          });
        }
        return result;
      };

      let resultArr = handleList(list);
      return resultArr;
    },

    setSearchResult() {
      let keywords = this.keywords.toLowerCase();

      if (~keywords.indexOf('http')) {
        // link
        this.resultList = [
          {
            type: 'qr',
          },
        ];
        return false;
      }

      let resultList = [];
      if (keywords && keywords.length > 2) {
        let FEToolsData = this.feToolsList || [];
        for (let i = 0, len = FEToolsData.length; i < len; i++) {
          let item = FEToolsData[i];
          //for (let j in item.target) {
          if (
            ~item.name.indexOf(keywords) ||
            (item.desc && ~item.desc.indexOf(keywords)) ||
            (item.target && ~item.target.join(' | ').indexOf(keywords))
          ) {
            if (!item.link) {
              if (item.children && item.children.length) {
                item.children.map(child => {
                  resultList.push({
                    label: 'tool',
                    color: 'orange',
                    link: child.link,
                    name:
                      child.name.replace(keywords, `<strong>${keywords}</strong>`) +
                      ` <em>(${child.desc})</em>`,
                  });
                });
              }
            } else {
              resultList.push({
                label: 'tool',
                color: 'orange',
                link: item.link,
                name:
                  item.name.replace(keywords, `<strong>${keywords}</strong>`) +
                  ` <em s-ft_sub_>(${item.desc})</em>`,
              });
            }
          }
          //}
        }
      }

      // 收藏夹
      let MarkList = this.markList || [];
      if (MarkList) {
        for (let i = 0, len = MarkList.length; i < len; i++) {
          let item = MarkList[i];

          if (~item.title.toLowerCase().indexOf(keywords)) {
            resultList.push({
              link: item.url,
              name: item.title.replace(keywords, `<strong>${keywords}</strong>`),
              color: 'red',
              label: 'mark',
            });
          }
        }
      }

      //if (!resultList.length || this.showMore) {
      DEFAULT_SEARCH_LIST.map(function (item) {
        resultList.push({
          link: item.link + keywords,
          name: `在${item.name}中搜索: <strong>${keywords}</strong>`,
        });
      });
      //}
      this.resultList = resultList;
    },

    hideFixCtn() {
      if (this.showCompName.includes('Ctn')) {
        return;
      }
      this.showCompName = '';
    },
  },
});
</script>
