<template>
  <section class="tool-workspace" :class="{ 'tool-workspace--wide': wide }">
    <header class="tool-workspace__header">
      <div>
        <h2 ref="heading" class="tool-workspace__title" tabindex="-1">{{ title }}</h2>
        <p v-if="description" class="tool-workspace__description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="tool-workspace__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="tool-workspace__content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

withDefaults(
  defineProps<{
    title: string;
    description?: string;
    wide?: boolean;
  }>(),
  {
    description: '',
    wide: false,
  }
);

const heading = ref<HTMLElement | null>(null);

const focusHeading = () => heading.value?.focus();

defineExpose({ focusHeading });
</script>
