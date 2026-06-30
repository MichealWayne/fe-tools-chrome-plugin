<template>
  <div
    v-if="state !== 'idle' || message"
    class="tool-state"
    :class="`tool-state--${state}`"
    :role="state === 'error' ? 'alert' : 'status'"
    :aria-live="state === 'error' ? 'assertive' : 'polite'"
  >
    <span v-if="state === 'loading'" class="tool-state__spinner" aria-hidden="true"></span>
    <span class="tool-state__message">{{ message }}</span>
    <button v-if="actionLabel" type="button" class="tool-state__action" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TaskState } from '@/types/experience';

withDefaults(
  defineProps<{
    state?: TaskState;
    message?: string;
    actionLabel?: string;
  }>(),
  {
    state: 'idle',
    message: '',
    actionLabel: '',
  }
);

defineEmits<{
  action: [];
}>();
</script>
