import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import ToolState from '@/components/Experience/ToolState.vue';
import ToolWorkspace from '@/components/Experience/ToolWorkspace.vue';
import { getFocusableElements, restoreFocus, trapFocus } from '@/utils/focus';

describe('experience primitives', () => {
  it('renders a labelled workspace and exposes heading focus', () => {
    const wrapper = mount(ToolWorkspace, {
      props: { title: 'Regex', description: 'Test expressions' },
      slots: { default: '<button>Run</button>' },
      attachTo: document.body,
    });

    expect(wrapper.get('h2').text()).toBe('Regex');
    expect(wrapper.text()).toContain('Test expressions');
    (wrapper.vm as unknown as { focusHeading: () => void }).focusHeading();
    expect(document.activeElement).toBe(wrapper.get('h2').element);
    wrapper.unmount();
  });

  it('uses status and alert semantics for dynamic states', () => {
    const loading = mount(ToolState, { props: { state: 'loading', message: 'Loading' } });
    const error = mount(ToolState, { props: { state: 'error', message: 'Failed' } });
    const validation = mount(InlineFeedback, {
      props: { feedback: { message: 'Required', tone: 'validation' } },
    });

    expect(loading.attributes('role')).toBe('status');
    expect(error.attributes('role')).toBe('alert');
    expect(validation.attributes('role')).toBe('alert');
  });

  it('cycles focus and restores a stable target', () => {
    const container = document.createElement('div');
    container.innerHTML = '<button id="first">First</button><button id="last">Last</button>';
    document.body.appendChild(container);
    const [first, last] = getFocusableElements(container);
    last.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    trapFocus(container, event);
    expect(document.activeElement).toBe(first);

    restoreFocus(last, first);
    expect(document.activeElement).toBe(last);
    container.remove();
  });
});
