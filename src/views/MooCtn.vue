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

type MooSearchResult = {
  label: string;
  color: string;
  name: string;
  link: string;
};

type MooStyleItem = {
  type: string;
  name: string;
  desc: string;
  ver: string;
};

type MooColorItem = {
  name: string;
  desc: string;
  show: string;
};

type MooFuncItem = {
  name: string;
  desc: string;
  place: string;
};

type MooClassItem = {
  type: string;
  name: string;
  desc: string;
  val: string;
};

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
    // eslint-disable-next-line complexity
    setSearchResult() {
      const keywords = this.keywords.toLowerCase();

      const resultList: MooSearchResult[] = [];
      if (keywords?.length > 1) {
        /**
         * Match CSS properties from the Moo CSS dictionary.
         */
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
                .replace(/\s/g, '')}`,
            });
          }
        }

        /**
         * Match color variables from Moo CSS dictionary.
         */
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

        /**
         * Match function helpers from Moo CSS dictionary.
         */
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
              link: 'https://blog.michealwayne.cn/Moo-CSS/docs/nameDictionary/#%E6%96%B9%E6%B3%95',
            });
          }
        }

        /**
         * Match style classes from Moo CSS dictionary.
         */
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
              link: 'https://blog.michealwayne.cn/Moo-CSS/docs/nameDictionary/#%E6%A0%B7%E5%BC%8F',
            });
          }
        }
      }
      this.resultList = resultList;
    },

    /**
     * Normalize the CSS property list from the raw MooCSS payload.
     * @param list - Raw list from the API.
     */
    handleStyleList(list: Record<string, unknown>[]) {
      const arr: MooStyleItem[] = [];

      Object.values(list).forEach(item => {
        const record = item as Record<string, unknown>;
        const name = String(record.name || '');
        const children = Array.isArray(record.children) ? record.children : [];

        children.forEach(subItem => {
          const child = subItem as Record<string, unknown>;
          arr.push({
            type: name,
            name: String(child['属性'] || ''),
            desc: String(child['说明'] || ''),
            ver: String(child['CSS版本'] || ''),
          });
        });
      });

      return arr;
    },
    /**
     * Normalize the MooCSS color dictionary payload.
     * @param list - Raw color list.
     */
    handleMooColorList(list: Record<string, unknown>[]) {
      return list.map(item => ({
        name: `${String(item['变量'] || '')} ${String(item['十六进制色值'] || '')}`.trim(),
        desc: String(item['说明'] || ''),
        show: String(item['效果'] || ''),
      }));
    },
    /**
     * Normalize the MooCSS function dictionary payload.
     * @param list - Raw function list.
     */
    handleMooFuncList(list: Record<string, unknown>[]) {
      return list.map(item => ({
        name: `${String(item['方法名'] || '')}(${String(item['参数'] || '')})`,
        desc: String(item['说明'] || ''),
        place: String(item['平台'] || ''),
      }));
    },
    /**
     * Normalize the MooCSS class dictionary payload.
     * @param list - Raw class list.
     */
    handleMooClassList(list: Record<string, unknown>[]) {
      const arr: MooClassItem[] = [];

      Object.values(list).forEach(item => {
        const record = item as Record<string, unknown>;
        const name = String(record.name || '');
        const children = Array.isArray(record.children) ? record.children : [];
        children.forEach(subItem => {
          const child = subItem as Record<string, unknown>;
          if (!child['类/属性名'] || !child['属性']) return;

          arr.push({
            type: name,
            name: String(child['类/属性名'] || ''),
            desc: String(child['说明'] || ''),
            val: String(child['属性'] || ''),
          });
        });
      });
      return arr;
    },

    /**
     * Split the API payload into internal lists for search.
     * @param data - Raw MooCSS payload.
     */
    handleList(data: unknown) {
      if (!data || typeof data !== 'object') return;
      Object.values(data as Record<string, unknown>).forEach(item => {
        const record = item as Record<string, unknown>;
        const name = String(record.name || '');
        const children = Array.isArray(record.children) ? record.children : [];
        if (name === '样式模块词典') {
          this.styleList = this.handleStyleList(children as Record<string, unknown>[]);
          return;
        }
        if (name === 'moo-css-base词典') {
          children.forEach(subItem => {
            const subRecord = subItem as Record<string, unknown>;
            const subName = String(subRecord.name || '');
            switch (subName) {
              case '颜色':
                this.mooColorList = this.handleMooColorList(
                  Array.isArray(subRecord.children)
                    ? (subRecord.children as Record<string, unknown>[])
                    : []
                );
                break;
              case '方法':
                this.mooFuncList = this.handleMooFuncList(
                  Array.isArray(subRecord.children)
                    ? (subRecord.children as Record<string, unknown>[])
                    : []
                );
                break;
              case '样式':
                this.mooClassList = this.handleMooClassList(
                  Array.isArray(subRecord.children)
                    ? (subRecord.children as Record<string, unknown>[])
                    : []
                );
                break;
              default:
                // Ignore unrecognized dictionary sections.
                break;
            }
          });
        }
      });
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
