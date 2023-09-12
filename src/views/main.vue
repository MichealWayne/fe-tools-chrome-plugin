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
          <p class="u-c-middle g-mt40">
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
        <section class="g-mt30 g-center">
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
          <ul class="m-others g-fs14 u-pt10 u-j-middle">
            <li class="f-tc" title="计算器，px/rem/vw换算" @click="showCompName = 'UnitCalculator'">
              <em class="u-icon iconfont icon-calc g-center g-fs36"></em>
              <span class="g-fs12">单位计算器</span>
            </li>
            <li class="f-tc" title="快速搜索Moo-CSS模块/方法" @click="showCompName = 'MooCtn'">
              <em class="u-icon iconfont icon-moo g-center g-fs36"></em>
              <span class="g-fs12">Moo-CSS</span>
            </li>
            <!-- @todo 有道翻译API暂时关闭 <li class="f-tc" title="快速中英文翻译" @click="showCompName = 'LangTranslator'"> -->
            <li class="f-tc" title="快速中英文翻译" @click="toYoudao">
              <em class="u-icon iconfont icon-fanyi g-center g-fs36"></em>
              <span class="g-fs12">快速翻译</span>
            </li>
            <li class="f-tc" title="常用正则表达式查询" @click="showCompName = 'RegexCtn'">
              <em class="u-icon iconfont icon-regex g-center g-fs36"></em>
              <span class="g-fs12">正则查询</span>
            </li>
          </ul>
          <ul class="m-others g-fs14 u-pt10 u-j-middle">
            <li class="f-tc" title="常用工具方法查询" @click="showCompName = 'UtilsCtn'">
              <em class="u-icon icon-utils g-center g-fs36"></em>
              <span class="g-fs12">工具方法</span>
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

import MooCtn from './MooCtn.vue';
import RegexCtn from './RegexCtn.vue';
import UtilsCtn from './UtilsCtn.vue';

import { DEFAULT_SEARCH_LIST } from '@/constant';

import CompMap from '@/components/';

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
};

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
        alert(e?.message || '链接信息获取失败');
      });
  },

  methods: {
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
      if (this.keywords) this.logoFold = true;
    },

    /**
     * 输入框失去焦点时，logo展示
     */
    handleInputBlur() {
      if (!this.keywords) {
        this.resultList = [];
        this.logoFold = false;
      }
    },

    /**
     * 输入时
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
      if (item.type === 'qr') {
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
      return item.type === 'qr' ? '生成二维码' : item.name;
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
            type: 'qr',
            link: '',
            name: 'qr',
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
      if (keywords && keywords.length > 2) {
        const FEToolsData = this.feToolsList || [];

        FEToolsData.forEach(item => {
          const IS_SUPPORT_KEYWORDS =
            item.name.includes(keywords) ||
            (item.desc && item.desc.includes(keywords)) ||
            (item.target && item.target.join(' | ').includes(keywords));

          if (IS_SUPPORT_KEYWORDS) {
            if (!item.link) {
              if (item.children?.length) {
                item.children.map((child: any) => {
                  resultList.push({
                    label: 'tools',
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
                label: 'tools',
                color: 'orange',
                link: item.link,
                name:
                  item.name.replace(keywords, `<strong>${keywords}</strong>`) +
                  ` <em s-ft_sub_>(${item.desc})</em>`,
              });
            }
          }
        });
      }

      // 收藏夹
      const MarkList = this.markList || [];
      if (MarkList) {
        MarkList.forEach(item => {
          if (item.title?.toLowerCase().includes(keywords)) {
            resultList.push({
              link: item.url as string,
              name: item.title.replace(keywords, `<strong>${keywords}</strong>`) as string,
              color: 'red',
              label: 'mark',
            });
          }
        });
      }

      DEFAULT_SEARCH_LIST.forEach(item => {
        resultList.push({
          link: item.link + keywords,
          name: `在${item.name}中搜索: <strong>${keywords}</strong>`,
        });
      });
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
