<template>
  <div
    :class="{ 'u-j-middle': !inPopup, 'm-big_translate': !inPopup }"
    class="m-translate"
    style="max-height: 100%; overflow-y: auto"
    @click.stop="stopPropagation"
  >
    <section>
      <p>
        {{ t('langTranslator.original') }}（<a class="u-link" s-cr_blue @click="reset">{{
          t('common.clear')
        }}</a
        >）
      </p>
      <textarea
        v-model="originTxt"
        :placeholder="t('langTranslator.placeholder')"
        class="u-textarea"
      ></textarea>
    </section>

    <section>
      <p>
        {{ t('langTranslator.result') }}（<a
          class="u-link"
          s-cr_blue
          @click="handleTranslate(originTxt)"
          >{{ t('langTranslator.retranslate') }}</a
        >）
      </p>
      <textarea v-model="resultTxt" class="u-textarea" @click.stop="textFocus"></textarea>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { langManager } from '@/utils/i18n';

import { AnyFunc } from '@/types/index';
import { getUrlParam } from '@/utils';
import handleTxtTranslate from './handleTxtTranslate';

export default defineComponent({
  name: 'LangTranslator',

  props: {
    back: {
      type: Function as AnyFunc,
      default: () => ({}),
    },
  },

  data() {
    return {
      /**
       * Source text to translate.
       */
      originTxt: '',

      /**
       * Translated result text.
       */
      resultTxt: '',

      /**
       * Whether the translator runs inside the popup window.
       */
      inPopup: getUrlParam('type') !== 'translate',

      /**
       * Debounce timer handle for translation requests.
       */
      timer: -1 as unknown,
    };
  },
  watch: {
    originTxt(newval, oldval) {
      if (!newval || newval === oldval) return;
      if (this.timer) {
        clearTimeout(this.timer as number);
      }
      const DEBOUNCE_TIME = 400;

      this.timer = setTimeout(() => {
        this.handleTranslate(newval);
      }, DEBOUNCE_TIME);
    },
  },

  mounted() {
    const val = getUrlParam('value');
    if (val) {
      this.originTxt = decodeURIComponent(val);
    }
  },

  methods: {
    t(key: string) {
      return langManager.t(key);
    },
    stopPropagation() {
      return false;
    },

    /**
     * Clear both the source and result text fields.
     */
    reset() {
      this.originTxt = '';
      this.resultTxt = '';
    },

    /**
     * Select input content when focused for quick replacement.
     * @param e - Focus event from the input.
     */
    textFocus(e: Event) {
      if (!e || !(e.target instanceof HTMLInputElement)) return;
      e.target.select();
    },

    /**
     * Translate the provided text via the translation service.
     * @param txt - Source text to translate.
     */
    async handleTranslate(txt: string) {
      try {
        this.resultTxt = await handleTxtTranslate(txt);
      } catch (e) {
        console.error(e);
        this.resultTxt = '';
      }
    },
  },
});
</script>
