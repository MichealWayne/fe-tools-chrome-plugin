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
            <li
              v-for="tool in toolCards"
              :key="tool.key"
              class="f-tc"
              :title="t(tool.descriptionKey)"
              @click="handleToolClick(tool)"
            >
              <em :class="tool.iconClass"></em>
              <span class="g-fs12">{{ t(tool.nameKey) }}</span>
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
    <button
      v-if="showCompName"
      class="m-back-entry"
      type="button"
      :title="t('common.backHome')"
      @click.stop="handleBackHome"
    >
      <i class="u-icon icon-home"></i>
      <span class="m-back-entry__label">{{ t('common.back') }}</span>
    </button>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { getUrlParam } from '@/utils';
import { getMarkTree, jumpAction } from '@/utils/chrome';
import ajax from '@/api';
import { langManager } from '@/utils/i18n';
import { TOOL_CARDS, type ToolCard } from './main/tool-cards';
import type { BookmarkItem, ComponentDataTypes } from './main/types';
import { sanitizeInlineMarkup } from '@/utils/sanitize';
import { buildSearchResults, normalizeFeToolsList } from './main/search-utils';

import MooCtn from './MooCtn.vue';
import RegexCtn from './RegexCtn.vue';
import UtilsCtn from './UtilsCtn.vue';

import { DEFAULT_SEARCH_LIST } from '@/constant';

import CompMap from '@/components/';

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
      /**
       * Search input keyword bound to the main query field.
       */
      keywords: '',
      /**
       * Bookmark tree pulled from the browser for local search.
       */
      markList: [],
      /**
       * Toggle flag controlling the folded logo state.
       */
      logoFold: '',

      /**
       * Current component name rendered in the main view.
       */
      showCompName: getUrlParam('search') ? 'QRCode' : '',
      /**
       * Aggregated search result list for tools and bookmarks.
       */
      resultList: [],
      /**
       * Remote tool metadata fetched from the API.
       */
      feToolsList: [],
      /**
       * Quick-launch cards displayed on the home view.
       */
      toolCards: TOOL_CARDS,
      /**
       * Active language code for UI localization.
       */
      currentLang: langManager.getCurrentLanguage(),
      /**
       * Listener reference used to remove language subscription on cleanup.
       */
      languageChangeHandler: undefined,
    };
  },

  beforeMount() {
    const _msg = getUrlParam('message');
    if (_msg) {
      this.keywords = _msg;
      this.setSearchResult();
    }
    getMarkTree((list: BookmarkItem[]) => {
      this.markList = list;
    });
    ajax
      .getFeTools()
      .then((data: { list?: unknown }) => {
        this.feToolsList = normalizeFeToolsList(data.list);
      })
      .catch((e: Error) => {
        alert(e?.message || this.t('errors.fetchLinksFailed'));
      });

    /**
     * Track language changes to keep select input in sync.
     */
    this.languageChangeHandler = (newLang: string) => {
      this.currentLang = newLang;
    };
    langManager.addListener(this.languageChangeHandler);
  },

  beforeUnmount() {
    /**
     * Clean up language change listener on teardown.
     */
    if (this.languageChangeHandler) {
      langManager.removeListener(this.languageChangeHandler);
    }
  },

  methods: {
    /**
     * Resolve a localized string by key with optional params.
     */
    t(key: string, params?: Record<string, string | number>): string {
      return langManager.t(key, params);
    },

    /**
     * Apply the selected language to the language manager.
     */
    handleLanguageChange() {
      langManager.setLanguage(this.currentLang);
    },

    /**
     * Navigate to the FeTools project homepage.
     */
    toHome() {
      jumpAction('https://github.com/MichealWayne/fe-tools');
    },

    /**
     * Handle clicks on quick tool cards.
     * @param tool - Tool card metadata.
     */
    handleToolClick(tool: ToolCard) {
      if (tool.componentName) {
        this.showCompName = tool.componentName;
        return;
      }
      if (tool.url) {
        jumpAction(tool.url);
      }
    },

    /**
     * Fold the logo when the search input gains focus.
     */
    handleInputFocus() {
      if (this.keywords) {
        this.logoFold = true;
      }
    },

    /**
     * Restore the logo and clear results when input loses focus with no query.
     */
    handleInputBlur() {
      if (!this.keywords) {
        this.resultList = [];
        this.logoFold = false;
      }
    },

    /**
     * Update results as the user types into the search box.
     */
    handleInputInput() {
      if (this.keywords) {
        this.logoFold = true;
        this.setSearchResult();
      }
    },

    /**
     * Open the selected result based on its type.
     * @param item - Result entry from the aggregated list.
     */
    handleResultClick(item: SearchResultItem) {
      if (item.type === QR_CODE_TYPE) {
        /**
         * Switch to the QR code view for URL rendering.
         */
        this.showCompName = 'QRCode';
      } else {
        jumpAction(item.link);
      }
    },

    /**
     * Return display-friendly text for a result entry.
     * @param item - Result entry object.
     */
    getResultText(item: SearchResultItem) {
      return sanitizeInlineMarkup(item?.name || '--');
    },

    /**
     * Map result type to a CSS label style.
     * @param type - Result category.
     */
    getResultLabel(type?: 'tools' | 'mark') {
      if (!type) return '';
      return {
        tools: 's-simple',
        mark: 's-red',
      }[type];
    },

    /**
     * Clear the search input and reset results.
     */
    handleSearchClear() {
      this.keywords = '';
      this.handleInputBlur();
    },

    /**
     * Build the search result list for the current keyword.
     */
    // eslint-disable-next-line complexity
    setSearchResult() {
      this.resultList = buildSearchResults({
        keywords: this.keywords,
        feToolsList: this.feToolsList,
        markList: this.markList,
        defaultSearchList: DEFAULT_SEARCH_LIST,
        translate: this.t,
        qrCodeType: QR_CODE_TYPE,
      });
    },

    /**
     * Close floating panels for non-CTN components.
     */
    hideFixCtn() {
      if (this.showCompName.includes('Ctn')) {
        return;
      }
      this.showCompName = '';
    },

    /**
     * Return to the home view from any module.
     */
    handleBackHome() {
      this.showCompName = '';
    },
  },
});
</script>
