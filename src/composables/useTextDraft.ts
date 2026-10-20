import { inject, provide, watch, type InjectionKey, type Ref } from 'vue';

type DraftStore = Map<string, string>;
const draftsKey: InjectionKey<DraftStore> = Symbol('popup-text-drafts');
const MAX_DRAFT_LENGTH = 2 * 1024 * 1024;

/** Each popup owns its own text-only store; no component, file or browser storage is retained. */
export const provideTextDrafts = () => {
  const store: DraftStore = new Map();
  provide(draftsKey, store);
  return store;
};

export const useTextDraft = (key: string, value: Ref<string>) => {
  const store = inject(draftsKey, undefined);
  const previous = store?.get(key);
  if (previous !== undefined) value.value = previous;
  watch(
    value,
    text => {
      if (!text || text.length > MAX_DRAFT_LENGTH) store?.delete(key);
      else store?.set(key, text);
    },
    { flush: 'sync' }
  );
};
