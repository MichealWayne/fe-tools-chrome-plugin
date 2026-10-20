<template>
  <main class="standalone-tool-page" :class="`standalone-tool-page--${tool}`">
    <tool-workspace
      class="standalone-tool-page__workspace"
      :title="t(isQr ? 'tools.qrCode' : 'tools.techStack')"
      :description="t(isQr ? 'descriptions.qrCode' : 'techStack.description')"
    >
      <template v-if="isQr">
        <QRCode v-if="sourceUrl" :keywords="sourceUrl" />
        <tool-state v-else state="error" :message="t('qrcode.messages.required')" />
      </template>
      <template v-else>
        <tech-stack-detection v-if="sourceTabId" :source-tab-id="sourceTabId" auto-start />
        <tool-state v-else state="error" :message="t('techStack.errorUnavailable')" />
      </template>
    </tool-workspace>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ToolWorkspace from './ToolWorkspace.vue';
import ToolState from './ToolState.vue';
import QRCode from '@/components/QRCode/index.vue';
import TechStackDetection from '@/components/TechStackDetection/index.vue';
import { langManager } from '@/utils/i18n';

const props = defineProps<{ tool: 'qrcode' | 'tech-stack' }>();
const isQr = computed(() => props.tool === 'qrcode');
const t = (key: string) => langManager.t(key);
const params = new URLSearchParams(window.location.search);
const sourceUrl = params.get('url') || '';
const requestedTabId = Number(params.get('sourceTabId'));
const sourceTabId =
  Number.isInteger(requestedTabId) && requestedTabId > 0 ? requestedTabId : undefined;
</script>

<style scoped>
.standalone-tool-page {
  box-sizing: border-box;
  width: min(760px, calc(100vw - 48px));
  margin: 40px auto;
}
.standalone-tool-page__workspace {
  width: 100%;
  padding: var(--spacing-lg);
}
.standalone-tool-page--tech-stack {
  width: min(1000px, calc(100vw - 48px));
}
.standalone-tool-page--tech-stack .standalone-tool-page__workspace {
  box-shadow: var(--shadow-sm);
}
.standalone-tool-page--tech-stack :deep(.tool-workspace__header) {
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
}
.standalone-tool-page--tech-stack :deep(.tool-workspace__title) {
  font-size: var(--font-size-xl);
}
.standalone-tool-page--qrcode :deep(.converter-tool__row) {
  flex-wrap: wrap;
}
.standalone-tool-page--qrcode :deep(.converter-tool__row input) {
  flex-basis: 100%;
  min-height: 44px;
}
.standalone-tool-page--qrcode :deep(.qr-tool__result) {
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  background: var(--color-background);
}
.standalone-tool-page--qrcode :deep(.qr-tool__image) {
  width: 240px;
}
@media (max-width: 520px) {
  .standalone-tool-page {
    width: calc(100vw - 24px);
    margin: 16px auto;
  }
  .standalone-tool-page__workspace {
    padding: var(--spacing-md);
  }
  .standalone-tool-page--qrcode :deep(.converter-tool__row button) {
    flex: 1;
  }
}
</style>
