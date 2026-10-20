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

    <element-preview v-else-if="type === 'screenshot-preview'" />

    <full-page-capture v-else-if="type === 'page-capture'" />

    <standalone-tool-page
      v-else-if="type === 'qrcode' || type === 'tech-stack'"
      :tool="type === 'qrcode' ? 'qrcode' : 'tech-stack'"
    />

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

import ElementPreview from '@/components/PageScreenshot/ElementPreview.vue';
import FullPageCapture from '@/components/PageScreenshot/FullPageCapture.vue';
import StandaloneToolPage from '@/components/Experience/StandaloneToolPage.vue';
import Main from './main.vue';
import PostMan from '../components/PostMan/PostManMain.vue';

export default defineComponent({
  name: 'App',

  components: {
    'v-main': Main,
    'v-postman': PostMan,
    'v-translate': Translate,
    ToolWorkspace,
    ElementPreview,
    FullPageCapture,
    StandaloneToolPage,
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
  --workspace-max-width: 1500px;
  --workspace-gutter: 48px;
  margin: 24px auto;
  height: calc(100dvh - 48px);
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.postman-tool-workspace > .tool-workspace__header {
  flex: 0 0 auto;
}

.postman-tool-workspace > .tool-workspace__content {
  display: flex;
  flex: 1;
  min-height: 0;
}

@media (max-width: 920px), (max-height: 520px) {
  .postman-tool-workspace.tool-workspace--wide {
    height: auto;
    min-height: calc(100dvh - 48px);
  }
  .postman-tool-workspace > .tool-workspace__content {
    display: block;
  }
}
</style>
