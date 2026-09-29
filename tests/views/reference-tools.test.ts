import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegexCtn from '@/views/RegexCtn.vue';
import MooCtn from '@/views/MooCtn.vue';
import UtilsCtn from '@/views/UtilsCtn.vue';
import LinuxCommand from '@/components/LinuxCommand/index.vue';
import ajax from '@/api';
import { jumpAction } from '@/utils/chrome';

vi.mock('@/api', () => ({
  default: {
    getRegex: vi.fn(),
    getLinuxCommands: vi.fn(),
    getMooCSS: vi.fn(),
    getUtilFuncs: vi.fn(),
  },
}));

vi.mock('@/utils/chrome', () => ({ jumpAction: vi.fn() }));

describe('reference tool experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ajax.getRegex).mockResolvedValue({ list: [] });
    vi.mocked(ajax.getLinuxCommands).mockResolvedValue({ list: [] });
    vi.mocked(ajax.getMooCSS).mockResolvedValue({ list: {} });
    vi.mocked(ajax.getUtilFuncs).mockResolvedValue({ data: {} });
  });

  it('shows Regex results, no-match state, and retryable load errors', async () => {
    vi.mocked(ajax.getRegex)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ list: [{ name: 'Email', regexStr: '^a$' }] });
    const wrapper = mount(RegexCtn);
    await flushPromises();
    expect(wrapper.get('.tool-state--error').text()).toContain('offline');

    await wrapper.get('.tool-state__action').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Email');
    await wrapper.get('input[type="search"]').setValue('missing');
    expect(wrapper.get('.tool-state--empty').exists()).toBe(true);
  });

  it('filters and expands Linux command results with semantic buttons', async () => {
    vi.mocked(ajax.getLinuxCommands).mockResolvedValue({
      list: [{ name: 'ls', description: 'list', syntax: 'ls -la', examples: [], options: [] }],
    });
    const wrapper = mount(LinuxCommand);
    await flushPromises();
    const detailButton = wrapper.findAll('.reference-tool__actions button')[1];
    expect(detailButton.attributes('aria-expanded')).toBe('false');
    await detailButton.trigger('click');
    expect(detailButton.attributes('aria-expanded')).toBe('true');
    await wrapper.get('input[type="search"]').setValue('unknown');
    expect(wrapper.get('.tool-state--empty').text()).toContain('未找到');
  });

  it('shows Moo CSS no-match state and opens semantic external results', async () => {
    const wrapper = mount(MooCtn);
    await flushPromises();
    expect(wrapper.get('.reference-tool__label').text()).toBe('关键词');
    expect(wrapper.get('input[type="search"]').attributes('placeholder')).toContain('属性');
    await wrapper.get('input[type="search"]').setValue('missing');
    expect(wrapper.get('.tool-state--empty').exists()).toBe(true);
    await wrapper.setData({
      resultList: [{ label: 'css', color: 'orange', name: 'display', link: 'https://mdn.test' }],
    });
    await wrapper.get('.reference-tool__result').trigger('click');
    expect(jumpAction).toHaveBeenCalledWith('https://mdn.test');
  });

  it('loads, filters, and opens utility function results', async () => {
    vi.mocked(ajax.getUtilFuncs).mockResolvedValue({
      data: {
        '1': { id: 1, name: 'chunk', query: 'array.chunk', hash: '', kind: 2, flags: {} },
        '2': { id: 2, name: 'trim', query: 'string.trim', hash: '', kind: 2, flags: {} },
      },
    });
    const wrapper = mount(UtilsCtn);
    await flushPromises();
    await wrapper.get('input[type="search"]').setValue('chunk');
    expect(wrapper.findAll('.reference-tool__result')).toHaveLength(1);
    await wrapper.get('.reference-tool__result').trigger('click');
    expect(jumpAction).toHaveBeenCalledWith(
      'https://blog.michealwayne.cn/fe-tools/stable/?page=array.chunk'
    );
  });
});
