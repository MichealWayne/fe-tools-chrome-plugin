<template>
  <section
    class="tool-workspace"
    :class="{ 'tool-workspace--wide': wide, 'tool-workspace--compact': compact }"
  >
    <header class="tool-workspace__header">
      <div v-if="$slots.leading" class="tool-workspace__leading"><slot name="leading" /></div>
      <div class="tool-workspace__heading">
        <h2
          ref="heading"
          class="tool-workspace__title"
          tabindex="-1"
          :title="compact && description ? `${title} — ${description}` : title"
        >
          {{ title }}
        </h2>
        <p
          v-if="description"
          class="tool-workspace__description"
          :class="{ 'visually-hidden': compact }"
        >
          {{ description }}
        </p>
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
    compact?: boolean;
  }>(),
  {
    description: '',
    wide: false,
    compact: false,
  }
);

const heading = ref<HTMLElement | null>(null);

const focusHeading = () => heading.value?.focus();

defineExpose({ focusHeading });
</script>
