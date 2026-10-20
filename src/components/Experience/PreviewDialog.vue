<template>
  <dialog
    ref="dialog"
    class="preview-dialog"
    aria-modal="true"
    :aria-label="title"
    @cancel.prevent="close"
    @keydown="onKeydown"
    @click.self="close"
  >
    <div class="preview-dialog__content">
      <header>
        <h3>{{ title }}</h3>
        <button type="button" class="tool-button" @click="close">{{ t('common.close') }}</button>
      </header>
      <slot />
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { langManager } from '@/utils/i18n';
defineProps<{ title: string }>();
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);
const previousFocus = document.activeElement as HTMLElement | null;
const t = (key: string) => langManager.t(key);
const close = () => emit('close');
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    close();
  }
  if (event.key !== 'Tab') return;
  const controls = Array.from(
    dialog.value?.querySelectorAll<HTMLElement>(
      'button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]'
    ) || []
  );
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
};
onMounted(() => {
  if (dialog.value?.showModal) dialog.value.showModal();
  else dialog.value?.setAttribute('open', '');
  dialog.value?.querySelector<HTMLElement>('button')?.focus();
});
onBeforeUnmount(() => {
  dialog.value?.close?.();
  if (previousFocus?.isConnected) previousFocus.focus();
});
</script>

<style scoped>
.preview-dialog {
  box-sizing: border-box;
  width: min(920px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  max-height: 90dvh;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-xl);
  color: var(--color-text-primary);
  background: var(--color-background-light);
  box-shadow: var(--shadow-xl);
}
.preview-dialog::backdrop {
  background: var(--color-overlay);
}
.preview-dialog__content {
  padding: var(--spacing-md);
  min-width: 0;
}
.preview-dialog header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: var(--spacing-md);
}
.preview-dialog h3 {
  margin: 0;
  font-size: var(--font-size-md);
}
</style>
