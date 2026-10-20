<template>
  <preview-dialog :title="t('svgEditor.previewTitle')" @close="$emit('close')">
    <image-viewer :src="src" :alt="t('svgEditor.previewTitle')" backgrounds />
  </preview-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PreviewDialog from '@/components/Experience/PreviewDialog.vue';
import ImageViewer from '@/components/Experience/ImageViewer.vue';
import { sanitizeSvgMarkup } from '@/utils/sanitize';
import { langManager } from '@/utils/i18n';
const props = defineProps<{ svg: string }>();
defineEmits<{ close: [] }>();
const t = (key: string) => langManager.t(key);
const src = computed(
  () => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanitizeSvgMarkup(props.svg))}`
);
</script>
