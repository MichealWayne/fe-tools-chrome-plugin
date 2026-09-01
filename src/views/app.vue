<template>
  <div>
    <!-- 简易PostMan -->
    <tool-workspace
      v-if="type === 'postman'"
      class="postman-tool-workspace"
      :title="t(postmanTool.nameKey)"
      :wide="postmanTool.workspaceSize === 'wide'"
    >
      <v-postman />
    </tool-workspace>

    <!-- 翻译 -->
    <v-translate v-else-if="type === 'translate'" />

    <!-- 主模块 -->
    <v-main v-else />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { getUrlParam } from '@/utils';
import { langManager } from '@/utils/i18n';
import Translate from '@/components/LangTranslator/index.vue';
import ToolWorkspace from '@/components/Experience/ToolWorkspace.vue';
import { TOOL_REGISTRY } from './main/tool-cards';

import Main from './main.vue';
import PostMan from '../components/PostMan/PostManMain.vue';

export default defineComponent({
  name: 'App',

  components: {
    'v-main': Main,
    'v-postman': PostMan,
    'v-translate': Translate,
    ToolWorkspace,
  },
  setup() {
    const postmanTool = TOOL_REGISTRY.find(tool => tool.key === 'postman');
    if (!postmanTool) throw new Error('PostMan tool metadata is missing');
    return {
      postmanTool,
      t: (key: string) => langManager.t(key),
    };
  },
  data() {
    return {
      type: getUrlParam('type'),
    };
  },
});
</script>

<style>
.postman-tool-workspace.tool-workspace--wide {
  width: min(1500px, calc(100vw - 48px));
  margin: 24px auto;
}
</style>
