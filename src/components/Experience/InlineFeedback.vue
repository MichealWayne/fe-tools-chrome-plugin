<template>
  <p
    v-if="feedback?.message"
    :id="feedback.id"
    class="inline-feedback"
    :class="`inline-feedback--${feedback.tone || 'info'}`"
    :role="isInterrupting ? 'alert' : 'status'"
    :aria-live="isInterrupting ? 'assertive' : 'polite'"
  >
    {{ feedback.message }}
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { InlineFeedbackMessage } from '@/types/experience';

const props = defineProps<{
  feedback?: InlineFeedbackMessage | null;
}>();

const isInterrupting = computed(
  () => props.feedback?.tone === 'error' || props.feedback?.tone === 'validation'
);
</script>
