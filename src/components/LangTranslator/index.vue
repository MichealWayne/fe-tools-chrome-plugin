<!--
 * @author Wayne
 * @Date 2023-06-27 14:16:17
 * @LastEditTime 2023-07-25 09:57:24
-->
<template>
  <div
    :class="{ 'u-j-middle': !inPopup, 'm-big_translate': !inPopup }"
    class="m-translate"
    style="max-height: 100%; overflow-y: auto"
    @click.stop="stopPropagation"
  >
    <section>
      <p>原文（<a class="u-link" s-cr_blue @click="reset">清空</a>）</p>
      <textarea
        v-model="originTxt"
        placeholder="输入或粘贴要翻译的内容"
        class="u-textarea"
      ></textarea>
    </section>

    <section>
      <p>结果（<a class="u-link" s-cr_blue @click="handleTranslate(originTxt)">重新翻译</a>）</p>
      <textarea v-model="resultTxt" class="u-textarea" @click.stop="textFocus"></textarea>
    </section>
    <p v-if="inPopup" class="u-link g-mt10 f-tc g-fs14" s-cr_blue @click.stop="back">返回主页</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

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
      // 原文
      originTxt: '',

      // 译文
      resultTxt: '',

      // 在窗口内
      inPopup: getUrlParam('type') !== 'translate',

      // 定时器
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
    stopPropagation() {
      return false;
    },

    /**
     * 重置输入和结果
     */
    reset() {
      this.originTxt = '';
      this.resultTxt = '';
    },

    /**
     * 自动选中
     */
    textFocus(e: Event) {
      if (!e || !(e.target instanceof HTMLInputElement)) return;
      e.target.select();
    },

    /**
     * 翻译
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
