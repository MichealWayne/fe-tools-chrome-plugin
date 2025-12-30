<!--
    主页面
-->
<template>
  <section class="m-ctn u-pt20 f-ovhidden">
    <!-- 语言切换器 -->
    <div class="language-switcher-header">
      <select v-model="currentLang" @change="handleLanguageChange" class="lang-select">
        <option value="zh">{{ t('languageOptions.zh') }}</option>
        <option value="en">{{ t('languageOptions.en') }}</option>
      </select>
    </div>

    <div v-show="!showCompName.includes('Ctn')" class="m-main_ctn">
      <div :class="{ 'f-blur': showCompName }">
        <h1 :class="{ 'z-fold': logoFold }" class="f-tc j-logo_ctn f-ovhidden">
          <img class="m-logo u-link" src="/icon.png" alt="icon" @click="toHome" />
        </h1>
        <section>
          <p class="m-search_input u-c-middle g-mt40 g-pr">
            <input
              id="search"
              v-model="keywords"
              class="m-s_input g-fs16 u-w300"
              :placeholder="t('searchPlaceholder')"
              autocomplete="off"
              type="text"
              autofocus
              @focus="handleInputFocus"
              @blur="handleInputBlur"
              @input="handleInputInput"
            />
            <span v-show="keywords" class="u-block u-close_ctn g-pa" @click="handleSearchClear">
              <i class="u-icon icon-close"></i>
            </span>
            <button s-color="blue" class="u-btn_il j-search g-fs18 g-ml10" @click="setSearchResult">
              {{ t('common.search') }}
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
        <section class="g-mt30 g-center">
          <ul class="m-others m-others--grid g-fs14 u-pt10">
            <li class="f-tc" :title="t('descriptions.qrCode')" @click="showCompName = 'QRCode'">
              <em class="u-icon iconfont icon-erweima g-fs36"></em>
              <span class="g-fs12">{{ t('tools.qrCode') }}</span>
            </li>
            <li
              class="f-tc"
              :title="t('descriptions.imageCompressor')"
              @click="showCompName = 'ImageCompressor'"
            >
              <em class="u-icon iconfont icon-compress-file g-fs36"></em>
              <span class="g-fs12">{{ t('tools.imageCompressor') }}</span>
            </li>
            <li
              class="f-tc"
              :title="t('descriptions.colorPass')"
              @click="showCompName = 'ColorPass'"
            >
              <em class="u-icon iconfont icon-chanyexietong g-fs36"></em>
              <span class="g-fs12">{{ t('tools.colorPass') }}</span>
            </li>
            <li class="f-tc" :title="t('descriptions.postMan')" @click="toPostMan">
              <em class="u-icon icon-postman g-center g-fs36"></em>
              <span class="g-fs12">{{ t('tools.postMan') }}</span>
            </li>
            <li
              class="f-tc"
              :title="t('descriptions.unitCalculator')"
              @click="showCompName = 'UnitCalculator'"
            >
              <em class="u-icon iconfont icon-calc g-center g-fs36"></em>
              <span class="g-fs12">{{ t('tools.unitCalculator') }}</span>
            </li>
            <li class="f-tc" :title="t('descriptions.mooCtn')" @click="showCompName = 'MooCtn'">
              <em class="u-icon iconfont icon-moo g-center g-fs36"></em>
              <span class="g-fs12">{{ t('tools.mooCtn') }}</span>
            </li>
            <!-- @todo 有道翻译API暂时关闭 <li class="f-tc" title="快速中英文翻译" @click="showCompName = 'LangTranslator'"> -->
            <li class="f-tc" :title="t('descriptions.langTranslator')" @click="toYoudao">
              <em class="u-icon iconfont icon-fanyi g-center g-fs36"></em>
              <span class="g-fs12">{{ t('tools.langTranslator') }}</span>
            </li>
            <li class="f-tc" :title="t('descriptions.regexCtn')" @click="showCompName = 'RegexCtn'">
              <em class="u-icon iconfont icon-regex g-center g-fs36"></em>
              <span class="g-fs12">{{ t('tools.regexCtn') }}</span>
            </li>
            <li class="f-tc" :title="t('descriptions.utilsCtn')" @click="showCompName = 'UtilsCtn'">
              <em class="u-icon icon-utils g-center g-fs36"></em>
              <span class="g-fs12">{{ t('tools.utilsCtn') }}</span>
            </li>
            <li class="f-tc" :title="t('descriptions.jsonCtn')" @click="showCompName = 'JsonCtn'">
              <em class="u-icon iconfont icon-utils g-center g-fs36"></em>
              <span class="g-fs12">{{ t('tools.jsonCtn') }}</span>
            </li>
            <li
              class="f-tc"
              :title="t('descriptions.svgEditor')"
              @click="showCompName = 'SvgEditor'"
            >
              <em class="u-icon iconfont icon-compress-file g-center g-fs36"></em>
              <span class="g-fs12">{{ t('tools.svgEditor') }}</span>
            </li>
            <li
              class="f-tc"
              :title="t('descriptions.dateConverter')"
              @click="showCompName = 'DateConverter'"
            >
              <em class="u-icon iconfont icon-calc g-center g-fs36"></em>
              <span class="g-fs12">{{ t('tools.dateConverter') }}</span>
            </li>
            <li
              class="f-tc"
              :title="t('descriptions.linuxCommand')"
              @click="showCompName = 'LinuxCommand'"
            >
              <em class="u-icon icon-utils g-center g-fs36"></em>
              <span class="g-fs12">{{ t('tools.linuxCommand') }}</span>
            </li>
            <li
              class="f-tc"
              :title="t('descriptions.pageScreenshot')"
              @click="showCompName = 'PageScreenshot'"
            >
              <em class="u-icon icon-utils g-center g-fs36"></em>
              <span class="g-fs12">{{ t('tools.pageScreenshot') }}</span>
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
import ajax from '@/api';
import { langManager } from '@/utils/i18n';

import MooCtn from './MooCtn.vue';
import RegexCtn from './RegexCtn.vue';
import UtilsCtn from './UtilsCtn.vue';

import { DEFAULT_SEARCH_LIST } from '@/constant';

import CompMap from '@/components/';
console.log('CompMap', CompMap);

type ComponentDataTypes = {
  keywords: string;
  markList: Array<{ title?: string; [key: string]: unknown }>;
  logoFold: string | boolean;

  showCompName: string;

  resultList: Array<{
    link: string;
    name: string;
    label?: 'tools' | 'mark';
    type?: string;
    color?: string;
    children?: any;
  }>;
  feToolsList: Array<{ name: string; link: string; desc: string; target: any; children?: any }>;
  currentLang: string;
  languageChangeHandler?: (lang: string) => void;
};

const QR_CODE_TYPE = 'qr';

export default defineComponent({
  name: 'MainContent',

  components: {
    ...CompMap,
    MooCtn,
    RegexCtn,
    UtilsCtn,
  },

  data(): ComponentDataTypes {
    return {
      // 搜索关键词
      keywords: '',
      // 本地书签信息
      markList: [],
      // logo折叠
      logoFold: '',

      // 当前展示的组件
      showCompName: getUrlParam('search') ? 'QRCode' : '',
      // 搜索结果
      resultList: [],
      // 远程工具信息列表
      feToolsList: [],
      // 当前语言
      currentLang: langManager.getCurrentLanguage(),
      // 语言变化处理器
      languageChangeHandler: undefined,
    };
  },

  beforeMount() {
    const _msg = getUrlParam('message');
    if (_msg) {
      this.keywords = _msg;
      this.setSearchResult();
    }
    getMarkTree((list: any) => {
      this.markList = list;
    });
    ajax
      .getFeTools()
      .then((data: any) => {
        const list = this.handleFEToolsList(data.list);
        this.feToolsList = list;
      })
      .catch((e: Error) => {
        alert(e?.message || t('errors.fetchLinksFailed'));
      });

    // 监听语言变化
    this.languageChangeHandler = (newLang: string) => {
      this.currentLang = newLang;
    };
    langManager.addListener(this.languageChangeHandler);
  },

  beforeUnmount() {
    // 清理语言监听器
    if (this.languageChangeHandler) {
      langManager.removeListener(this.languageChangeHandler);
    }
  },

  methods: {
    /**
     * 获取翻译文本
     */
    t(key: string, params?: Record<string, string | number>): string {
      return langManager.t(key, params);
    },

    /**
     * 处理语言切换
     */
    handleLanguageChange() {
      langManager.setLanguage(this.currentLang);
    },

    /**
     * 前往简易postman
     */
    toPostMan() {
      jumpAction('index.html?type=postman');
    },

    /**
     * 去fe-tools主页
     */
    toHome() {
      jumpAction('https://github.com/MichealWayne/fe-tools');
    },

    /**
     * 去有道翻译
     */
    toYoudao() {
      jumpAction('https://fanyi.youdao.com/indexLLM.html#/');
    },

    /**
     * 输入框聚焦时，logo隐藏
     */
    handleInputFocus() {
      if (this.keywords) {
        this.logoFold = true;
      }
    },

    /**
     * 输入框失去焦点时，如无输入内容则logo展示
     */
    handleInputBlur() {
      if (!this.keywords) {
        this.resultList = [];
        this.logoFold = false;
      }
    },

    /**
     * 输入搜索内容时
     */
    handleInputInput() {
      if (this.keywords) {
        this.logoFold = true;
        this.setSearchResult();
      }
    },

    /**
     * 检索结果的点击
     */
    handleResultClick(item: any) {
      if (item.type === QR_CODE_TYPE) {
        // qr code
        this.showCompName = 'QRCode';
      } else {
        jumpAction(item.link);
      }
    },

    /**
     * 结果的展示文案
     */
    getResultText(item: any) {
      return item.name || '--';
    },

    /**
     * 结果的展示标签
     */
    getResultLabel(type?: 'tools' | 'mark') {
      if (!type) return '';
      return {
        tools: 's-simple',
        mark: 's-red',
      }[type];
    },

    /**
     * 清除搜索结果
     */
    handleSearchClear() {
      this.keywords = '';
      this.handleInputBlur();
    },

    /**
     * 处理结果
     */
    handleFEToolsList(list: any): Array<{
      name: string;
      link: string;
      desc: string;
      target: any;
      children?: any;
    }> {
      const handleList = (
        data: any
      ): Array<{
        name: string;
        link: string;
        desc: string;
        target: any;
        children?: any;
      }> => {
        const result = [];
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (item.link && item.name) {
              result.push({
                name: item.name,
                link: item.link,
                desc: item.desc,
                target: item.target,
              });
            }

            if (item.children?.length) {
              result.push(...handleList(item.children));
            }
          });
        }
        if (data.link && data.name) {
          result.push({
            name: data.name,
            link: data.link,
            desc: data.desc,
            target: data.target,
          });
        }
        return result;
      };

      return handleList(list);
    },

    // eslint-disable-next-line complexity
    setSearchResult() {
      const keywords = this.keywords.toLowerCase();

      if (keywords.startsWith('http')) {
        // link
        this.resultList = [
          {
            type: QR_CODE_TYPE,
            link: '',
            name: t('search.qrCodeResult'),
          },
        ];
        return;
      }

      const resultList: Array<{
        link: string;
        name: string;
        label?: 'tools' | 'mark';
        type?: string;
        color?: string;
        children?: any;
      }> = [];
      if (keywords?.length > 2) {
        const FEToolsData = this.feToolsList || [];

        // fe-tools链接匹配
        FEToolsData.forEach(item => {
          const IS_SUPPORT_KEYWORDS =
            item.name.includes(keywords) ||
            item.desc?.includes(keywords) ||
            (item.target && item.target.join(' | ').includes(keywords));

          if (IS_SUPPORT_KEYWORDS) {
            if (!item.link) {
              if (item.children?.length) {
                item.children.forEach((child: any) => {
                  resultList.push({
                    label: 'tools',
                    color: 'orange',
                    link: child.link,
                    name: `${child.name.replace(keywords, `<strong>${keywords}</strong>`)} <em>(${
                      child.desc
                    })</em>`,
                  });
                });
              }
            } else {
              resultList.push({
                label: 'tools',
                color: 'orange',
                link: item.link,
                name: `${item.name.replace(
                  keywords,
                  `<strong>${keywords}</strong>`
                )} <em s-ft_sub_>(${item.desc})</em>`,
              });
            }
          }
        });
      }

      // 收藏夹匹配
      const MarkList = this.markList || [];
      MarkList?.forEach(item => {
        if (item.title?.toLowerCase().includes(keywords)) {
          resultList.push({
            link: item.url as string,
            name: item.title.replace(keywords, `<strong>${keywords}</strong>`) as string,
            color: 'red',
            label: 'mark',
          });
        }
      });

      // 默认检索匹配
      DEFAULT_SEARCH_LIST.forEach(item => {
        resultList.push({
          link: item.link + keywords,
          name: t('search.searchIn', { site: item.name, keywords }),
        });
      });
      this.resultList = resultList;
    },

    // 隐藏弹窗模块（除了完整页面，Ctn为标志）
    hideFixCtn() {
      if (this.showCompName.includes('Ctn')) {
        return;
      }
      this.showCompName = '';
    },
  },
});
</script>
