<!-- eslint-disable vue/no-parsing-error -->
<template>
  <section class="m-regex">
    <p class="m-filter_ctn u-c-middle">
      <input v-model="filterTxt" class="u-input" type="text" :placeholder="t('regex.filter')" />
    </p>
    <ul class="g-mt30">
      <li
        v-for="(item, index) in regexList"
        :key="index"
        :class="{
          'z-fold': !item.isOpened,
          'z-hide':
            !(item.name || '').includes(filterTxt) && !(item.description || '').includes(filterTxt),
        }"
        class="m-regex_item g-center g-mb20"
      >
        <p class="g-fs14">
          {{ item.name }}
          <span v-if="item.description" class="g-fs12">（{{ item.description }}）</span>
          <a class="u-link g-fs12 g-ml5" s-cr_blue @click="handleRegTest(index)">{{
            t('regex.test')
          }}</a>
        </p>
        <p class="g-mt10">
          <figure>
            <pre :class="$style.pre">{{ item.regexStr }}</pre>
          </figure>
        </p>
        <p class="j-fold m-regex_input g-mt10">
          <input
            :placeholder="t('regex.inputTest')"
            :class="'j-regInput_' + index"
            class="u-input"
            type="text"
          /><button class="u-btn_il g-ml10" s-color="blue" @click="handleRegTestClick(index)">
            {{ t('regex.test') }}
          </button>
        </p>
        <p :class="'j-regOutput_' + index" class="j-fold f-tc g-mt10"></p>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { langManager } from '@/utils/i18n';

import { AnyFunc } from '@/types';
import ajax from '@/api';

type ComponentDataTypes = {
  filterTxt: string;
  regexList: RegexItem[];
};

type RegexItem = {
  name: string;
  description?: string;
  regexStr: string;
  isOpened?: boolean;
};
export default defineComponent({
  name: 'RegexCtn',

  props: {
    back: {
      type: Function as AnyFunc,
      default: () => ({}),
    },
  },

  data(): ComponentDataTypes {
    return {
      filterTxt: '',
      regexList: [],
    };
  },

  mounted() {
    ajax.getRegex().then((data: { list?: RegexItem[] }) => {
      this.regexList = data.list || [];
    });
  },
  methods: {
    t(key: string) {
      return langManager.t(key);
    },

    handleRegTest(index: number) {
      if (this.regexList[index]) {
        this.regexList[index].isOpened = true;
      }
      this.$forceUpdate();
    },
    handleRegTestClick(index: number) {
      try {
        const $input = document.querySelector(`.j-regInput_${index}`) as HTMLInputElement;
        const res =
          this.regexList[index] && new RegExp(this.regexList[index].regexStr).test($input.value);
        document.querySelector(`.j-regOutput_${index}`)!.innerHTML = `<span s-color="${
          (res && 'blue') || 'red'
        }">${this.t('regex.result')}：${res}</span>`;
      } catch (err) {
        alert((err as Error).message);
      }
    },
  },
});
</script>

<style lang="less" module>
.pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: rgb(246, 248, 250);
  border-radius: 6px;
}
</style>

<style lang="less">
.m-filter_ctn {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  height: 50px;
  background-color: #fff;
  border-bottom: 1px solid #e2e2e2;

  input {
    padding: 5px 10px;
    width: 460px;
    height: 20px;
  }
}
.m-regex {
  height: 450px;
  overflow-y: auto;
}
.m-regex_item {
  padding: 8px;
  width: 435px;
  box-shadow: 0 3px 5px #ccc;

  &.z-fold {
    .j-fold {
      display: none;
    }
  }
}
.m-regex_input {
  input {
    padding: 5px 10px;
    width: 320px;
    height: 20px;
  }
  .u-btn_il {
    height: 30px;
    line-height: 30px;
    border-radius: 8px;
  }
}
.m-regex_back {
  position: fixed;
  z-index: 3;
  right: 10px;
  bottom: 10px;
  width: 40px;
  height: 40px;
  line-height: 20px;
  text-align: center;
  color: #fff;
  background-color: #2969f7;
  cursor: pointer;
}
</style>
