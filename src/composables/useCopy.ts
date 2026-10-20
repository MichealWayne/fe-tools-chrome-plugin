import { onBeforeUnmount, ref } from 'vue';

/** Clipboard feedback scoped to one control; stale writes never mark a new value as copied. */
export const useCopy = (duration = 1500) => {
  const copied = ref(false);
  const failed = ref(false);
  const pending = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  let active = true;

  const reset = () => {
    generation += 1;
    clearTimeout(timer);
    copied.value = false;
    failed.value = false;
    pending.value = false;
  };

  const copy = async (value: string): Promise<boolean> => {
    if (!active) return false;
    reset();
    const operation = generation;
    pending.value = true;
    let success = false;
    try {
      await navigator.clipboard.writeText(value);
      success = true;
    } catch {
      // Report a localized failure at the control; never expose clipboard payloads or raw errors.
    }
    if (!active || operation !== generation) return false;
    pending.value = false;
    copied.value = success;
    failed.value = !success;
    timer = setTimeout(reset, duration);
    return success;
  };

  onBeforeUnmount(() => {
    active = false;
    generation += 1;
    clearTimeout(timer);
  });

  return { copy, copied, failed, pending, reset };
};
