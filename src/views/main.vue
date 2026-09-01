<template>
  <section
    class="m-ctn m-ctn--scrollable u-pt20"
    :class="{
      'm-ctn--home': !showCompName,
      'm-ctn--wide':
        activeTool?.workspaceSize === 'wide' && activeTool.destination === 'standalone',
    }"
  >
    <div class="settings-header">
      <button
        ref="settingsEntry"
        class="u-btn settings-entry"
        type="button"
        :title="t('settings.entryTitle')"
        @click="openSettings"
      >
        <i class="u-icon icon-settings" aria-hidden="true"></i>
        <span class="settings-entry__label">{{ t('settings.entryLabel') }}</span>
      </button>
    </div>

    <main-settings-dialog
      v-if="showSettings"
      :current-lang="currentLang"
      :enable-pinyin-search="enablePinyinSearch"
      :translate="t"
      @close="closeSettings"
      @language-change="handleLanguageChange"
      @pinyin-change="handlePinyinSearchToggle"
    />

    <div v-show="!showCompName" class="m-main_ctn">
      <h1 :class="{ 'z-fold': logoFold }" class="f-tc j-logo_ctn">
        <button
          type="button"
          class="logo-button"
          :aria-label="t('title')"
          :title="t('homeTitle')"
          @click="toHome"
        >
          <img class="m-logo" src="/icon.png" alt="" />
        </button>
      </h1>
      <section>
        <p class="m-search_input u-c-middle g-mt20 g-pr">
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
        <search-results-list
          v-if="!resultsDismissed && resultList.length"
          :results="resultList"
          :active-index="activeResultIndex"
          :translate="t"
          @hover="activeResultIndex = $event"
          @select="handleResultClick"
        />
        <tool-state
          v-else-if="keywords && !feToolsLoading && !resultsDismissed"
          state="empty"
          :message="t('experience.noResults')"
        />
      </section>

      <tool-launcher-grid
        v-show="!keywords"
        :tools="toolCards"
        :language="currentLang"
        :translate="t"
        @tool-click="handleToolClick"
      />
    </div>

    <div v-if="showCompName" class="module-host">
      <tool-workspace
        ref="activeWorkspace"
        :title="activeTool ? t(activeTool.nameKey) : t('title')"
        :description="activeTool ? t(activeTool.descriptionKey) : ''"
        :wide="activeTool?.workspaceSize === 'wide' && activeTool.destination === 'standalone'"
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
import { TOOL_REGISTRY, type ToolCard } from './main/tool-cards';
import type { BookmarkItem, ComponentDataTypes, SearchResultItem } from './main/types';
import { normalizeFeToolsList } from './main/search-utils';
import { getPinyinSearchPreference, setPinyinSearchPreference } from './main/preferences';
import { restoreFocus } from '@/utils/focus';
import ToolState from '@/components/Experience/ToolState.vue';
import ToolWorkspace from '@/components/Experience/ToolWorkspace.vue';
import { getDefaultSearchList } from '@/constant';
import CompMap from '@/components/';
import MainSettingsDialog from './main/MainSettingsDialog.vue';
import SearchResultsList from './main/SearchResultsList.vue';
import ToolLauncherGrid from './main/ToolLauncherGrid.vue';
import { useToolNavigation } from './main/useToolNavigation';
import { useToolSearch } from './main/useToolSearch';
import {
  getResultLabel,
  getResultText,
  getToolAccessibleLabel,
  getToolTitle,
} from './main/tool-presentation';

const QR_CODE_TYPE = 'qr';
const toolSearch = useToolSearch();
const toolNavigation = useToolNavigation();
export default defineComponent({
  name: 'MainContent',
  components: {
    ...CompMap,
    MainSettingsDialog,
    SearchResultsList,
    ToolLauncherGrid,
    ToolState,
    ToolWorkspace,
  },

  data(): ComponentDataTypes {
    return {
      keywords: '',
      markList: [],
      logoFold: '',
      showSettings: false,
      showCompName: getUrlParam('search') ? 'QRCode' : '',
      resultList: [],
      feToolsList: [],
      toolCards: TOOL_REGISTRY,
      currentLang: langManager.getCurrentLanguage(),
      enablePinyinSearch: getPinyinSearchPreference(),
      languageChangeHandler: undefined,
      feToolsLoading: false,
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
      return getToolTitle(tool, this.t);
    },
    getToolAccessibleLabel(tool: ToolCard): string {
      return getToolAccessibleLabel(tool, this.t, this.currentLang);
    },
    loadFeTools() {
      this.feToolsLoading = true;
      // The remote list only supplements local tools; keep the home page usable when it fails.
      return ajax
        .getFeTools()
        .then((data: { list?: unknown }) => {
          this.feToolsList = normalizeFeToolsList(data.list);
          if (this.keywords) this.setSearchResult();
        })
        .catch(() => undefined)
        .finally(() => {
          this.feToolsLoading = false;
        });
    },
    handleLanguageChange(value?: string) {
      if (value) this.currentLang = value;
      langManager.setLanguage(this.currentLang);
    },
    openSettings(event?: Event) {
      this.settingsTrigger =
        (event?.currentTarget as HTMLElement) || (this.$refs.settingsEntry as HTMLElement);
      this.showSettings = true;
    },
    closeSettings() {
      this.showSettings = false;
      nextTick(() => restoreFocus(this.settingsTrigger, this.$refs.settingsEntry as HTMLElement));
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
      this.activeResultIndex = toolSearch.resetSelection();
      if (this.keywords) {
        this.logoFold = true;
        this.setSearchResult();
      } else {
        this.handleInputBlur();
      }
    },
    handleSearchKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        this.activeResultIndex = toolSearch.resetSelection();
        this.resultsDismissed = true;
        return;
      }
      if (!this.resultList.length) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.resultsDismissed = false;
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        this.activeResultIndex = toolSearch.getNextResultIndex(
          this.activeResultIndex,
          this.resultList.length,
          direction
        );
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
      return getResultText(item);
    },
    getResultLabel(type?: 'tools' | 'mark') {
      return getResultLabel(type);
    },
    handleSearchClear() {
      this.keywords = '';
      this.activeResultIndex = toolSearch.resetSelection();
      this.resultsDismissed = false;
      this.handleInputBlur();
    },
    handlePinyinSearchToggle(value?: boolean) {
      if (typeof value === 'boolean') this.enablePinyinSearch = value;
      setPinyinSearchPreference(this.enablePinyinSearch);
      if (this.keywords) this.setSearchResult();
    },
    setSearchResult() {
      this.resultList = toolSearch.buildResults({
        keywords: this.keywords,
        feToolsList: this.feToolsList,
        markList: this.markList,
        defaultSearchList: getDefaultSearchList(this.currentLang as 'zh' | 'en'),
        translate: this.t,
        qrCodeType: QR_CODE_TYPE,
        enablePinyinSearch: this.enablePinyinSearch,
      });
      this.activeResultIndex = toolSearch.resetSelection();
    },
    focusActiveWorkspace() {
      const workspace = this.$refs.activeWorkspace as { focusHeading?: () => void } | undefined;
      toolNavigation.focusWorkspace(workspace);
    },
    handleBackHome() {
      this.showCompName = '';
      nextTick(() => {
        const fallback = document.querySelector<HTMLElement>('#search');
        toolNavigation.restoreHomeFocus(this.lastToolTrigger, fallback);
      });
    },
  },
});
</script>
