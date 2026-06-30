import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MainContent from '@/views/main.vue';
import { langManager } from '@/utils/i18n';
import { normalizeFeToolsList } from '@/views/main/search-utils';
import { PINYIN_SEARCH_STORAGE_KEY } from '@/views/main/preferences';
import ajax from '@/api';
import { jumpAction } from '@/utils/chrome';

vi.mock('@/api', () => ({
  default: {
    getFeTools: vi.fn().mockResolvedValue({ list: [] }),
  },
}));

vi.mock('@/utils/chrome', () => ({
  getMarkTree: vi.fn((callback: (list: unknown[]) => void) => callback([])),
  jumpAction: vi.fn(),
}));

vi.mock('@/components/', () => ({
  default: {},
}));

describe('MainContent settings window', () => {
  beforeEach(() => {
    localStorage.clear();
    langManager.setLanguage('zh');
    vi.mocked(ajax.getFeTools).mockReset().mockResolvedValue({ list: [] });
    vi.mocked(jumpAction).mockClear();
  });

  it('renders a compact categorized grid and identifies non-embedded destinations', async () => {
    const wrapper = mount(MainContent);
    await flushPromises();

    expect(wrapper.findAll('.tool-card')).toHaveLength(15);
    expect(wrapper.findAll('.tool-card__category')).toHaveLength(0);
    expect(wrapper.findAll('.tool-card__destination')).toHaveLength(0);
    expect(wrapper.get('.m-ctn').classes()).toContain('m-ctn--scrollable');
    expect(wrapper.get('.m-ctn').classes()).toContain('m-ctn--home');
    expect(wrapper.get('.m-ctn').classes()).not.toContain('f-ovhidden');
    expect(wrapper.find('[data-tool-key="postman"]').exists()).toBe(true);
    expect(wrapper.get('[data-tool-key="qr-code"]').attributes('aria-label')).toContain(
      '转换与生成'
    );
    expect(wrapper.get('[data-tool-key="lang-translator"]').attributes('aria-label')).toContain(
      '外部网站'
    );
    expect(wrapper.get('[data-tool-key="lang-translator"]').attributes('title')).toContain(
      '外部网站'
    );
    expect(wrapper.get('[data-tool-key="postman"]').attributes('aria-label')).toContain('独立页面');
    expect(wrapper.get('[data-tool-key="postman"]').attributes('title')).toContain('独立页面');
  });

  it('supports keyboard result selection and activation', async () => {
    const wrapper = mount(MainContent);
    await flushPromises();
    await wrapper.setData({
      keywords: 'json',
      resultList: [{ link: 'https://example.test/json', name: 'JSON' }],
    });
    expect(wrapper.get('.tool-groups').attributes('style')).toContain('display: none');

    await wrapper.get('#search').trigger('keydown', { key: 'ArrowDown' });
    expect(wrapper.get('.search-result').classes()).toContain('z-selected');

    await wrapper.get('#search').trigger('keydown', { key: 'Enter' });
    expect(jumpAction).toHaveBeenCalledWith('https://example.test/json');

    await wrapper.get('#search').trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('.m-searchList').exists()).toBe(false);
  });

  it('restores focus across settings and module transitions', async () => {
    const wrapper = mount(MainContent, { attachTo: document.body });
    await flushPromises();
    const settingsEntry = wrapper.get('.settings-entry').element as HTMLButtonElement;
    settingsEntry.focus();
    await wrapper.get('.settings-entry').trigger('click');
    expect(wrapper.find('.settings-window').exists()).toBe(true);

    await wrapper.get('.settings-window').trigger('keydown', { key: 'Escape' });
    await wrapper.vm.$nextTick();
    expect(document.activeElement).toBe(settingsEntry);

    const qrCard = wrapper.get('[data-tool-key="qr-code"]');
    await qrCard.trigger('click');
    await wrapper.vm.$nextTick();
    expect(document.activeElement).toBe(wrapper.get('.tool-workspace__title').element);

    await wrapper.get('.m-back-entry').trigger('click');
    await wrapper.vm.$nextTick();
    expect(document.activeElement).toBe(qrCard.element);
    wrapper.unmount();
  });

  it('shows a retryable remote-source error without hiding local tools', async () => {
    vi.mocked(ajax.getFeTools).mockRejectedValueOnce(new Error('offline'));
    const wrapper = mount(MainContent);
    await flushPromises();

    expect(wrapper.get('.tool-state--error').text()).toContain('offline');
    expect(wrapper.find('[data-tool-key="qr-code"]').exists()).toBe(true);
    await wrapper.get('.tool-state__action').trigger('click');
    await flushPromises();
    expect(ajax.getFeTools).toHaveBeenCalledTimes(2);
  });

  it('opens settings from the top-right entry and keeps language selection wired', async () => {
    const wrapper = mount(MainContent);
    await flushPromises();

    expect(wrapper.find('.language-switcher-header').exists()).toBe(false);
    expect(wrapper.find('.m-pinyin_toggle').exists()).toBe(false);

    await wrapper.find('.settings-entry').trigger('click');

    expect(wrapper.find('.settings-window').exists()).toBe(true);
    expect((wrapper.find('.settings-select').element as HTMLSelectElement).value).toBe('zh');

    await wrapper.find('.settings-select').setValue('en');

    expect(langManager.getCurrentLanguage()).toBe('en');
    expect(localStorage.getItem('fe-tools-language')).toBe('en');

    await wrapper.find('.settings-window__close').trigger('click');

    expect(wrapper.find('.settings-window').exists()).toBe(false);
  });

  it('persists pinyin search changes from settings and refreshes current results', async () => {
    const wrapper = mount(MainContent);
    await flushPromises();
    await wrapper.setData({
      keywords: 'yanse',
      feToolsList: normalizeFeToolsList([
        {
          name: '颜色变量',
          link: 'https://tools/color',
          desc: '颜色格式转换',
        },
      ]),
    });
    await wrapper.find('.settings-entry').trigger('click');

    await wrapper.find('.settings-checkbox').setValue(false);

    expect(localStorage.getItem(PINYIN_SEARCH_STORAGE_KEY)).toBe('false');
    expect(wrapper.vm.resultList.some(item => item.label === 'tools')).toBe(false);

    await wrapper.find('.settings-checkbox').setValue(true);

    expect(localStorage.getItem(PINYIN_SEARCH_STORAGE_KEY)).toBe('true');
    expect(wrapper.vm.resultList.some(item => item.link === 'https://tools/color')).toBe(true);
  });
});
