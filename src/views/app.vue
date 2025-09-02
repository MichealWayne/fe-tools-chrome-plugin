<!--
 * @author Wayne
 * @Date 2022-03-01 16:49:14
 * @LastEditTime 2025-09-02 21:10:05
-->
<template>
  <div>
    <!-- 简易PostMan -->
    <v-postman v-if="type === 'postman'" />

    <!-- 翻译 -->
    <v-translate v-else-if="type === 'translate'" />

    <!-- 主模块 -->
    <v-main v-else />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { getUrlParam } from '@/utils';
import Translate from '@/components/LangTranslator/index.vue';

import Main from './main.vue';
import PostMan from '../components/PostMan/PostManMain.vue';

export default defineComponent({
  name: 'App',

  components: {
    'v-main': Main,
    'v-postman': PostMan,
    'v-translate': Translate,
  },
  data() {
    return {
      type: getUrlParam('type'),
    };
  },
});
</script>
