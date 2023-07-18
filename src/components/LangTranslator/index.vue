<template>
  <div
    :class="{ 'u-j-middle': !inPopup, 'm-big_translate': !inPopup }"
    class="m-translate"
    style="max-height: 100%; overflow-y: auto"
  >
    <section>
      <p>原文（<a class="u-link" s-cr_blue @click="handleClear">清空</a>）</p>
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
import { getUrlParam } from '@/utils';
import ajax from '@/api/ajax';

export default defineComponent({
  name: 'LangTranslator',

  props: {
    back: {
      type: Function,
      default: () => {},
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
      if (!newval || newval === oldval) return false;
      if (this.timer) {
        clearTimeout(this.timer as number);
      }

      this.timer = setTimeout(() => {
        this.handleTranslate(newval);
      }, 400);
    },
  },

  mounted() {
    let val = getUrlParam('value');
    if (val) {
      this.originTxt = decodeURIComponent(val);
    }
  },

  methods: {
    textFocus(e: Event) {
      if (!e || !(e.target instanceof HTMLInputElement)) return;
      e.target.select();
    },

    handleClear() {
      this.originTxt = '';
      this.resultTxt = '';
    },

    handleTranslate(txt: string) {
      ajax
        .handleTranslate({
          doctype: 'json',
          type: 'AUTO',
          i: txt,
        })
        .then((data: any) => {
          if (data.translateResult?.length) {
            const resultArr = data.translateResult || [];
            let resultTxt = '';

            resultArr.map((itemArr: any[]) => {
              if (itemArr?.length) {
                itemArr.map(item => {
                  resultTxt += item.tgt;
                });
              }
            });

            this.resultTxt = resultTxt || '';
          }
        });
    },
  },
});
</script>
