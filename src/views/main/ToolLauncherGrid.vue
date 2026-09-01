<template>
  <section class="tool-groups g-center" :aria-label="translate('toolsLabel')">
    <ul class="m-others m-others--grid g-fs14">
      <li v-for="tool in tools" :key="tool.key" class="f-tc">
        <button
          type="button"
          class="tool-card"
          :data-tool-key="tool.key"
          :title="getToolTitle(tool, translate)"
          :aria-label="getToolAccessibleLabel(tool, translate, language)"
          @click="emit('tool-click', tool, $event)"
        >
          <em :class="tool.iconClass" aria-hidden="true"></em>
          <span class="tool-card__name g-fs12">{{ translate(tool.nameKey) }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { getToolAccessibleLabel, getToolTitle, type ToolTranslate } from './tool-presentation';
import type { ToolCard } from './tool-cards';

defineProps<{
  tools: ToolCard[];
  language: string;
  translate: ToolTranslate;
}>();

const emit = defineEmits<{
  'tool-click': [tool: ToolCard, event: MouseEvent];
}>();
</script>
