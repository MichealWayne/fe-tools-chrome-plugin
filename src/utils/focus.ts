const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Return visible focusable descendants in DOM order. */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    element => !element.hidden && element.getAttribute('aria-hidden') !== 'true'
  );

/** Keep Tab navigation inside a modal-like container. */
export const trapFocus = (container: HTMLElement, event: KeyboardEvent): void => {
  if (event.key !== 'Tab') return;
  const elements = getFocusableElements(container);
  if (!elements.length) {
    event.preventDefault();
    container.focus();
    return;
  }

  const first = elements[0];
  const last = elements[elements.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

/** Focus a target when possible and fall back to a stable element. */
export const restoreFocus = (target?: HTMLElement | null, fallback?: HTMLElement | null): void => {
  const destination = target?.isConnected ? target : fallback;
  destination?.focus();
};
