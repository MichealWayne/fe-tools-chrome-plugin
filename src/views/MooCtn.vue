<template>
  <section class="reference-tool m-moo">
    <section>
      <label class="reference-tool__search">
        <span class="reference-tool__label">{{ t('mooCss.searchLabel') }}</span>
        <input
          v-model="keywords"
          class="m-s_input g-fs16"
          :placeholder="t('mooCss.searchPlaceholder')"
          autocomplete="off"
          type="search"
          @input="handleInputInput"
        />
      </label>
    </section>
    <tool-state v-if="loading" state="loading" :message="t('experience.loading')" />
    <tool-state
      v-else-if="loadError"
      state="error"
      :message="loadError"
      :action-label="t('experience.retry')"
      @action="loadMooCss"
    />
    <tool-state
      v-else-if="keywords.length > 1 && !resultList.length"
      state="empty"
      :message="t('experience.noResults')"
    />
    <p v-else class="reference-tool__count">
      {{ t('experience.resultCount', { count: resultList.length }) }}
    </p>
    <ul class="reference-tool__list">
      <li v-for="(item, index) in resultList" :key="`${item.link}-${index}`">
        <button type="button" class="reference-tool__result" @click="handleResultClick(item)">
          <em v-if="item.label" class="u-icon_il icon-label" :class="getResultLabel(item.label)">{{
            item.label
          }}</em>
          <span v-html="getResultName(item)"></span>
          <small>{{ t('experience.external') }}</small>
        </button>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { langManager } from '@/utils/i18n';

import { AnyFunc } from '@/types';
import { jumpAction } from '@/utils/chrome';
import ajax from '@/api';
import { sanitizeInlineMarkup } from '@/utils/sanitize';
import ToolState from '@/components/Experience/ToolState.vue';
import {
  normalizeMooClassList,
  normalizeMooColorList,
  normalizeMooFuncList,
  normalizeMooPayload,
  normalizeStyleList,
} from './moo/moo-data-adapter';
import { searchMooIndex } from './moo/moo-search';
import type {
  MooClassItem,
  MooColorItem,
  MooFuncItem,
  MooSearchResult,
  MooStyleItem,
} from './moo/types';

export default defineComponent({
  name: 'MooCtn',

  components: { ToolState },

  props: {
    back: {
      type: Function as AnyFunc,
      default: () => ({}),
    },
  },

  data(): {
    keywords: string;
    logoFold: boolean;
    resultList: MooSearchResult[];
    styleList: MooStyleItem[];
    mooColorList: MooColorItem[];
    mooFuncList: MooFuncItem[];
    mooClassList: MooClassItem[];
    loading: boolean;
    loadError: string;
  } {
    return {
      keywords: '',
      logoFold: false,

      /**
       * Search results rendered in the Moo CSS view.
       */
      resultList: [],

      /**
       * Normalized CSS property dictionary list.
       */
      styleList: [],

      /**
       * MooCSS color dictionary list.
       */
      mooColorList: [],

      /**
       * MooCSS function dictionary list.
       */
      mooFuncList: [],

      /**
       * MooCSS class dictionary list.
       */
      mooClassList: [],
      loading: false,
      loadError: '',
    };
  },

  mounted() {
    this.loadMooCss();
  },
  methods: {
    /**
     * Translate a key into the current language.
     */
    t(key: string, params?: Record<string, string | number>) {
      return langManager.t(key, params);
    },

    async loadMooCss() {
      this.loading = true;
      this.loadError = '';
      try {
        const data = await ajax.getMooCSS();
        if (data?.list) this.handleList(data.list);
      } catch (error) {
        this.loadError = (error as Error).message || this.t('mooCss.loadFailed');
      } finally {
        this.loading = false;
      }
    },

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
        } as Record<string, string>
      )[type];
    },
    /**
     * Open selected MooCSS item link.
     * @param item - Search result entry.
     */
    handleResultClick(item: MooSearchResult) {
      jumpAction(item.link);
    },

    /**
     * Sanitize search result markup before rendering.
     * @param item - Search result entry.
     */
    getResultName(item: MooSearchResult) {
      return sanitizeInlineMarkup(item?.name || '');
    },

    /**
     * Build search results for CSS, colors, functions, and classes.
     */
    setSearchResult() {
      this.resultList = searchMooIndex({
        keywords: this.keywords,
        language: langManager.getCurrentLanguage(),
        translate: this.t,
        styleList: this.styleList || [],
        mooColorList: this.mooColorList || [],
        mooFuncList: this.mooFuncList || [],
        mooClassList: this.mooClassList || [],
      });
    },

    /**
     * Normalize the CSS property list from the raw MooCSS payload.
     * @param list - Raw list from the API.
     */
    handleStyleList(list: Record<string, unknown>[]) {
      return normalizeStyleList(list, langManager.getCurrentLanguage());
    },
    /**
     * Normalize the MooCSS color dictionary payload.
     * @param list - Raw color list.
     */
    handleMooColorList(list: Record<string, unknown>[]) {
      return normalizeMooColorList(list, langManager.getCurrentLanguage());
    },
    /**
     * Normalize the MooCSS function dictionary payload.
     * @param list - Raw function list.
     */
    handleMooFuncList(list: Record<string, unknown>[]) {
      return normalizeMooFuncList(list, langManager.getCurrentLanguage());
    },
    /**
     * Normalize the MooCSS class dictionary payload.
     * @param list - Raw class list.
     */
    handleMooClassList(list: Record<string, unknown>[]) {
      return normalizeMooClassList(list, langManager.getCurrentLanguage());
    },

    /**
     * Split the API payload into internal lists for search.
     * @param data - Raw MooCSS payload.
     */
    handleList(data: unknown) {
      const normalized = normalizeMooPayload(data, langManager.getCurrentLanguage());
      if (normalized.styleList) this.styleList = normalized.styleList;
      if (normalized.mooColorList) this.mooColorList = normalized.mooColorList;
      if (normalized.mooFuncList) this.mooFuncList = normalized.mooFuncList;
      if (normalized.mooClassList) this.mooClassList = normalized.mooClassList;
    },
  },
});
</script>

<style scoped>
.m-moo {
  display: grid;
  gap: var(--spacing-sm);
  width: 100%;
  min-width: 0;
}

.m-moo .reference-tool__search input {
  box-sizing: border-box;
  width: 100%;
  min-height: 36px;
  padding: 8px 12px;
}

.m-moo .reference-tool__list {
  min-width: 0;
  margin-top: var(--spacing-sm);
}

.m-moo .reference-tool__result {
  box-sizing: border-box;
  min-height: 40px;
  padding: 8px 12px;
  line-height: var(--line-height-normal);
}

.m-moo .reference-tool__result span {
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
