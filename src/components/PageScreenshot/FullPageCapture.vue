<template>
  <tool-workspace class="full-page-capture" :title="t('pageScreenshot.title')">
    <tool-state v-if="!sourceTabId" state="error" :message="t('pageScreenshot.errorUnavailable')" />
    <page-screenshot v-else :source-tab-id="sourceTabId" @finished="showResult" />
  </tool-workspace>
</template>

<script setup lang="ts">
import ToolWorkspace from '@/components/Experience/ToolWorkspace.vue';
import ToolState from '@/components/Experience/ToolState.vue';
import PageScreenshot from './index.vue';
import { langManager } from '@/utils/i18n';

const t = (key: string) => langManager.t(key);
const requestedTabId = Number(new URLSearchParams(window.location.search).get('sourceTabId'));
const sourceTabId =
  Number.isInteger(requestedTabId) && requestedTabId > 0 ? requestedTabId : undefined;
const showResult = async () => {
  try {
    const tab = await chrome.tabs.getCurrent();
    if (tab?.id) await chrome.tabs.update(tab.id, { active: true });
  } catch {
    // The user may close the task tab before capture finishes.
  }
};
</script>

<style scoped>
.full-page-capture {
  --workspace-max-width: 1000px;
  --workspace-gutter: 48px;
  margin: 24px auto;
}
</style>
