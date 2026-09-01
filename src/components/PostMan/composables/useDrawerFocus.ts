import { nextTick, type Ref, watch } from 'vue';

export type PostmanDrawer = 'environments' | 'history' | 'saved' | 'curl' | '';

type DrawerFocusOptions = {
  activeDrawer: Ref<PostmanDrawer>;
  drawerRef: Ref<HTMLElement | null>;
};

/** Keeps drawer focus behavior isolated from PostMan request coordination. */
export const useDrawerFocus = ({ activeDrawer, drawerRef }: DrawerFocusOptions) => {
  const toggleDrawer = (drawer: Exclude<PostmanDrawer, ''>) => {
    activeDrawer.value = activeDrawer.value === drawer ? '' : drawer;
  };

  const closeDrawer = () => {
    activeDrawer.value = '';
  };

  watch(activeDrawer, value => {
    if (value) nextTick(() => drawerRef.value?.focus());
  });

  const trapDrawerFocus = (event: KeyboardEvent) => {
    const drawer = drawerRef.value;
    if (!drawer) return;
    const focusable = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return { toggleDrawer, closeDrawer, trapDrawerFocus };
};
