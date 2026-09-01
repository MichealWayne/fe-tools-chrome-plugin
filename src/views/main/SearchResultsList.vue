<template>
  <ul
    class="m-searchList u-w420 j-searchList g-center"
    role="listbox"
    :aria-label="translate('search.resultsLabel')"
  >
    <li v-for="(item, index) in results" :key="item.link + '-' + index" role="none">
      <button
        type="button"
        role="option"
        class="search-result"
        :class="{
          'z-selected': activeIndex === index,
          'search-result--bookmark': item.label === 'mark',
        }"
        :aria-selected="activeIndex === index"
        @mouseenter="emit('hover', index)"
        @click="emit('select', item)"
      >
        <em v-if="item.label" class="u-icon_il icon-label" :class="getResultLabel(item.label)">{{
          item.label
        }}</em>
        <span v-html="getResultText(item)"></span>
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { getResultLabel, getResultText, type ToolTranslate } from './tool-presentation';
import type { SearchResultItem } from './types';

defineProps<{
  results: SearchResultItem[];
  activeIndex: number;
  translate: ToolTranslate;
}>();

const emit = defineEmits<{
  hover: [index: number];
  select: [item: SearchResultItem];
}>();
</script>
