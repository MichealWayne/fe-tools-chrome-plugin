import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MainContent from '@/views/main.vue';
import { langManager } from '@/utils/i18n';
import { normalizeFeToolsList } from '@/views/main/search-utils';
import { PINYIN_SEARCH_STORAGE_KEY } from '@/views/main/preferences';

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
