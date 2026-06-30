<template>
  <section class="m-ctn m-ctn--scrollable u-pt20" :class="{ 'm-ctn--home': !showCompName }">
    <div class="settings-header">
      <button
        ref="settingsEntry"
        class="settings-entry"
        type="button"
        :title="t('settings.entryTitle')"
        @click="openSettings"
      >
        <i class="u-icon icon-settings" aria-hidden="true"></i>
        <span class="settings-entry__label">{{ t('settings.entryLabel') }}</span>
      </button>
    </div>

    <div
      v-if="showSettings"
      class="settings-window"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      @keydown="handleSettingsKeydown"
    >
      <div ref="settingsPanel" class="settings-window__panel" tabindex="-1">
        <header class="settings-window__header">
          <strong id="settings-title">{{ t('settings.title') }}</strong>
          <button
            class="settings-window__close"
            type="button"
            :aria-label="t('settings.close')"
            :title="t('settings.close')"
            @click="closeSettings"
          >
            <i class="u-icon icon-close" aria-hidden="true"></i>
          </button>
        </header>
        <div class="settings-window__body">
          <label class="settings-field">
            <span class="settings-field__label">{{ t('settings.language') }}</span>
            <select
              v-model="currentLang"
              class="settings-select"
              aria-describedby="settings-language-help"
              @change="handleLanguageChange"
            >
              <option value="zh">{{ t('languageOptions.zh') }}</option>
              <option value="en">{{ t('languageOptions.en') }}</option>
            </select>
            <span id="settings-language-help" class="settings-field__help">{{
              t('settings.languageHelp')
            }}</span>
          </label>
          <label class="settings-field settings-field--inline">
            <span>
              <span class="settings-field__label">{{ t('settings.pinyinSearch') }}</span>
              <span id="settings-pinyin-help" class="settings-field__help">{{
                t('settings.pinyinSearchHelp')
              }}</span>
            </span>
            <input
              v-model="enablePinyinSearch"
              class="settings-checkbox"
              type="checkbox"
              aria-describedby="settings-pinyin-help"
              @change="handlePinyinSearchToggle"
            />
          </label>
        </div>
      </div>
    </div>

    <div v-show="!showCompName" class="m-main_ctn">
      <h1 :class="{ 'z-fold': logoFold }" class="f-tc j-logo_ctn f-ovhidden">
        <button type="button" class="logo-button" :aria-label="t('title')" @click="toHome">
          <img class="m-logo" src="/icon.png" alt="" />
        </button>
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
            @keydown="handleSearchKeydown"
          />
          <button
            v-show="keywords"
            type="button"
            class="u-block u-close_ctn g-pa search-clear"
            :aria-label="t('common.clear')"
            @click="handleSearchClear"
          >
            <i class="u-icon icon-close" aria-hidden="true"></i>
          </button>
          <button s-color="blue" class="u-btn_il j-search g-fs18 g-ml10" @click="setSearchResult">
            {{ t('common.search') }}
          </button>
        </p>
        <tool-state
          v-if="keywords && feToolsLoading"
          state="loading"
          :message="t('experience.loading')"
        />
        <tool-state
          v-if="feToolsError"
          state="error"
          :message="feToolsError"
          :action-label="t('experience.retry')"
          @action="loadFeTools"
        />
        <ul
          v-if="!resultsDismissed && resultList.length"
          class="m-searchList u-w420 j-searchList g-center"
          role="listbox"
          :aria-label="t('search.resultsLabel')"
        >
          <li v-for="(item, index) in resultList" :key="`${item.link}-${index}`" role="none">
            <button
              type="button"
              role="option"
              class="search-result"
              :class="{ 'z-selected': activeResultIndex === index }"
              :aria-selected="activeResultIndex === index"
              @mouseenter="activeResultIndex = index"
              @click="handleResultClick(item)"
            >
              <em
                v-if="item.label"
                class="u-icon_il icon-label"
                :class="getResultLabel(item.label)"
                >{{ item.label }}</em
              >
              <span v-html="getResultText(item)"></span>
            </button>
          </li>
        </ul>
        <tool-state
          v-else-if="keywords && !feToolsLoading && !resultsDismissed"
          state="empty"
          :message="t('experience.noResults')"
        />
      </section>

      <section v-show="!keywords" class="tool-groups g-center" :aria-label="t('toolsLabel')">
        <ul class="m-others m-others--grid g-fs14">
          <li v-for="tool in toolCards" :key="tool.key" class="f-tc">
            <button
              type="button"
              class="tool-card"
              :data-tool-key="tool.key"
              :title="getToolTitle(tool)"
              :aria-label="getToolAccessibleLabel(tool)"
              @click="handleToolClick(tool, $event)"
            >
              <em :class="tool.iconClass" aria-hidden="true"></em>
              <span class="tool-card__name g-fs12">{{ t(tool.nameKey) }}</span>
            </button>
          </li>
        </ul>
      </section>
    </div>

    <div v-if="showCompName" class="module-host">
      <tool-workspace
        ref="activeWorkspace"
        :title="activeTool ? t(activeTool.nameKey) : t('title')"
        :description="activeTool ? t(activeTool.descriptionKey) : ''"
      >
        <component :is="showCompName" :keywords="keywords" :back="handleBackHome" />
      </tool-workspace>
    </div>
    <button
      v-if="showCompName"
      class="m-back-entry"
      type="button"
      :title="t('common.backHome')"
      @click.stop="handleBackHome"
    >
      <i class="u-icon icon-home" aria-hidden="true"></i>
      <span class="m-back-entry__label">{{ t('common.back') }}</span>
    </button>
  </section>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import { getUrlParam } from '@/utils';
import { getMarkTree, jumpAction } from '@/utils/chrome';
import ajax from '@/api';
import { langManager } from '@/utils/i18n';
import { TOOL_CARDS, type ToolCard } from './main/tool-cards';
import type { BookmarkItem, ComponentDataTypes, SearchResultItem } from './main/types';
import { sanitizeInlineMarkup } from '@/utils/sanitize';
import { buildSearchResults, normalizeFeToolsList } from './main/search-utils';
import { getPinyinSearchPreference, setPinyinSearchPreference } from './main/preferences';
import { restoreFocus, trapFocus } from '@/utils/focus';
import ToolState from '@/components/Experience/ToolState.vue';
import ToolWorkspace from '@/components/Experience/ToolWorkspace.vue';
import MooCtn from './MooCtn.vue';
import RegexCtn from './RegexCtn.vue';
import UtilsCtn from './UtilsCtn.vue';
import { DEFAULT_SEARCH_LIST } from '@/constant';
import CompMap from '@/components/';

const QR_CODE_TYPE = 'qr';
export default defineComponent({
  name: 'MainContent',
  components: { ...CompMap, MooCtn, RegexCtn, UtilsCtn, ToolState, ToolWorkspace },

  data(): ComponentDataTypes {
    return {
      keywords: '',
      markList: [],
      logoFold: '',
      showSettings: false,
      showCompName: getUrlParam('search') ? 'QRCode' : '',
      resultList: [],
      feToolsList: [],
      toolCards: TOOL_CARDS,
      currentLang: langManager.getCurrentLanguage(),
      enablePinyinSearch: getPinyinSearchPreference(),
      languageChangeHandler: undefined,
      feToolsLoading: false,
      feToolsError: '',
      activeResultIndex: -1,
      resultsDismissed: false,
      lastToolTrigger: null,
      settingsTrigger: null,
    };
  },

  computed: {
    activeTool(): ToolCard | undefined {
      return this.toolCards.find(tool => tool.componentName === this.showCompName);
    },
  },

  beforeMount() {
    const message = getUrlParam('message');
    if (message) {
      this.keywords = message;
      this.setSearchResult();
    }
    getMarkTree((list: BookmarkItem[]) => {
      this.markList = list;
    });
    this.loadFeTools();
    this.languageChangeHandler = (newLang: string) => {
      this.currentLang = newLang;
    };
    langManager.addListener(this.languageChangeHandler);
  },

  mounted() {
    if (this.showCompName) nextTick(() => this.focusActiveWorkspace());
  },

  beforeUnmount() {
    if (this.languageChangeHandler) langManager.removeListener(this.languageChangeHandler);
  },

  methods: {
    t(key: string, params?: Record<string, string | number>): string {
      return langManager.t(key, params);
    },
    getToolTitle(tool: ToolCard): string {
      const parts = [this.t(tool.descriptionKey)];
      if (tool.destination !== 'embedded') {
        parts.push(this.t(`experience.${tool.destination}`));
      }
      return parts.join(' · ');
    },
    getToolAccessibleLabel(tool: ToolCard): string {
      const parts = [
        this.t(tool.nameKey),
        this.t(`experience.categories.${tool.category}`),
        this.t(tool.descriptionKey),
      ];
      if (tool.destination !== 'embedded') {
        parts.push(this.t(`experience.${tool.destination}`));
      }
      return parts.join('，');
    },
    loadFeTools() {
      this.feToolsLoading = true;
      this.feToolsError = '';
      return ajax
        .getFeTools()
        .then((data: { list?: unknown }) => {
          this.feToolsList = normalizeFeToolsList(data.list);
          if (this.keywords) this.setSearchResult();
        })
        .catch((error: Error) => {
          this.feToolsError = error?.message || this.t('errors.fetchLinksFailed');
        })
        .finally(() => {
          this.feToolsLoading = false;
        });
    },
    handleLanguageChange() {
      langManager.setLanguage(this.currentLang);
    },
    openSettings(event?: Event) {
      this.settingsTrigger =
        (event?.currentTarget as HTMLElement) || (this.$refs.settingsEntry as HTMLElement);
      this.showSettings = true;
      nextTick(() => {
        const panel = this.$refs.settingsPanel as HTMLElement | undefined;
        (panel?.querySelector<HTMLElement>('button, select, input') || panel)?.focus();
      });
    },
    closeSettings() {
      this.showSettings = false;
      nextTick(() => restoreFocus(this.settingsTrigger, this.$refs.settingsEntry as HTMLElement));
    },
    handleSettingsKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeSettings();
        return;
      }
      const panel = this.$refs.settingsPanel as HTMLElement | undefined;
      if (panel) trapFocus(panel, event);
    },
    toHome() {
      jumpAction('https://github.com/MichealWayne/fe-tools');
    },
    handleToolClick(tool: ToolCard, event?: Event) {
      if (tool.componentName) {
        this.lastToolTrigger = event?.currentTarget as HTMLElement;
        this.showCompName = tool.componentName;
        nextTick(() => this.focusActiveWorkspace());
      } else if (tool.url) {
        jumpAction(tool.url);
      }
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
      this.resultsDismissed = false;
      this.activeResultIndex = -1;
      if (this.keywords) {
        this.logoFold = true;
        this.setSearchResult();
      } else {
        this.handleInputBlur();
      }
    },
    handleSearchKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        this.activeResultIndex = -1;
        this.resultsDismissed = true;
        return;
      }
      if (!this.resultList.length) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.resultsDismissed = false;
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const next = this.activeResultIndex + direction;
        this.activeResultIndex = (next + this.resultList.length) % this.resultList.length;
      } else if (event.key === 'Enter' && this.activeResultIndex >= 0) {
        event.preventDefault();
        this.handleResultClick(this.resultList[this.activeResultIndex]);
      }
    },
    handleResultClick(item: SearchResultItem) {
      if (item.type === QR_CODE_TYPE) {
        this.lastToolTrigger = document.activeElement as HTMLElement;
        this.showCompName = 'QRCode';
        nextTick(() => this.focusActiveWorkspace());
      } else {
        jumpAction(item.link);
      }
    },
    getResultText(item: SearchResultItem) {
      return sanitizeInlineMarkup(item?.name || '--');
    },
    getResultLabel(type?: 'tools' | 'mark') {
      if (!type) return '';
      return { tools: 's-simple', mark: 's-red' }[type];
    },
    handleSearchClear() {
      this.keywords = '';
      this.activeResultIndex = -1;
      this.resultsDismissed = false;
      this.handleInputBlur();
    },
    handlePinyinSearchToggle() {
      setPinyinSearchPreference(this.enablePinyinSearch);
      if (this.keywords) this.setSearchResult();
    },
    setSearchResult() {
      this.resultList = buildSearchResults({
        keywords: this.keywords,
        feToolsList: this.feToolsList,
        markList: this.markList,
        defaultSearchList: DEFAULT_SEARCH_LIST,
        translate: this.t,
        qrCodeType: QR_CODE_TYPE,
        enablePinyinSearch: this.enablePinyinSearch,
      });
      this.activeResultIndex = -1;
    },
    focusActiveWorkspace() {
      const workspace = this.$refs.activeWorkspace as { focusHeading?: () => void } | undefined;
      workspace?.focusHeading?.();
    },
    handleBackHome() {
      this.showCompName = '';
      nextTick(() => {
        const fallback = document.querySelector<HTMLElement>('#search');
        restoreFocus(this.lastToolTrigger, fallback);
      });
    },
  },
});
</script>
