import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PostManMain from '@/components/PostMan/PostManMain.vue';
import RequestBody from '@/components/PostMan/RequestBody.vue';
import RequestHistory from '@/components/PostMan/RequestHistory.vue';
import EnvironmentVariables from '@/components/PostMan/EnvironmentVariables.vue';
import ResponseViewer from '@/components/PostMan/ResponseViewer.vue';

const { axiosRequest } = vi.hoisted(() => ({ axiosRequest: vi.fn() }));
vi.mock('axios', () => ({
  default: Object.assign(axiosRequest, { isAxiosError: vi.fn(() => false) }),
}));

describe('PostMan workflow experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:test'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  it('focuses the URL field and reports missing request input', async () => {
    const wrapper = mount(PostManMain, { attachTo: document.body });
    await (wrapper.vm as unknown as { sendRequest: () => Promise<void> }).sendRequest();
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('URL');
    expect(document.activeElement).toBe(wrapper.get('.url-input').element);
    wrapper.unmount();
  });

  it('reports save and copy outcomes through non-modal feedback', async () => {
    const main = mount(PostManMain);
    await main.get('.save-btn').trigger('click');
    expect(main.get('[role="status"]').text()).toContain('保存');

    const response = mount(ResponseViewer, {
      props: {
        response: {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'text/plain' },
          data: 'ok',
          responseTime: 12,
          size: 2,
        },
      },
    });
    await response.get('.copy-btn').trigger('click');
    expect(response.emitted('feedback')?.[0]).toEqual(['响应内容已复制', 'success']);
  });

  it('prevents duplicate requests while one is pending', async () => {
    let resolveRequest!: (value: unknown) => void;
    axiosRequest.mockReturnValue(
      new Promise(resolve => {
        resolveRequest = resolve;
      })
    );
    const wrapper = mount(PostManMain);
    await wrapper.get('.url-input').setValue('https://api.test');
    const api = wrapper.vm as unknown as { sendRequest: () => Promise<void> };
    const first = api.sendRequest();
    await api.sendRequest();
    expect(axiosRequest).toHaveBeenCalledTimes(1);
    resolveRequest({ status: 200, statusText: 'OK', headers: {}, data: { ok: true } });
    await first;
  });

  it('loads request JSON and reports the result without changing its schema', async () => {
    const wrapper = mount(PostManMain);
    const originalCreate = document.createElement.bind(document);
    let fileInput: HTMLInputElement | undefined;
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const element = originalCreate(tagName, options);
      if (tagName === 'input') fileInput = element as HTMLInputElement;
      return element;
    });
    await wrapper.get('.load-btn').trigger('click');
    const file = new File(
      [
        '{"method":"POST","url":"https://loaded.test","headers":[],"body":{"type":"none"},"auth":{"type":"none"}}',
      ],
      'request.json',
      { type: 'application/json' }
    );
    Object.defineProperty(fileInput!, 'files', { configurable: true, value: [file] });
    fileInput!.dispatchEvent(new Event('change'));
    await new Promise(resolve => setTimeout(resolve, 0));
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toContain('加载');
    expect((wrapper.get('.url-input').element as HTMLInputElement).value).toBe(
      'https://loaded.test'
    );
  });

  it('shows inline JSON format validation instead of a browser alert', async () => {
    const wrapper = mount(RequestBody, {
      props: { modelValue: { type: 'json', json: '{invalid' } },
    });
    await wrapper.get('.format-btn').trigger('click');
    expect(wrapper.get('[role="alert"]').text()).toContain('JSON');
  });

  it('requires in-context confirmation before clearing history', async () => {
    const wrapper = mount(RequestHistory, {
      props: {
        history: [{ method: 'GET', url: 'https://api.test', headers: {}, timestamp: Date.now() }],
      },
    });
    await wrapper.get('.clear-btn').trigger('click');
    expect(wrapper.get('[role="alertdialog"]').exists()).toBe(true);
    expect(wrapper.emitted('clear-history')).toBeUndefined();
    await wrapper.get('[role="alertdialog"] button').trigger('click');
    expect(wrapper.emitted('clear-history')).toHaveLength(1);
  });

  it('confirms environment deletion and reports imports without changing the data shape', async () => {
    const wrapper = mount(EnvironmentVariables, {
      props: {
        environments: [{ name: 'Dev', variables: [{ key: 'token', value: 'abc' }] }],
        currentEnvironment: 'Dev',
      },
    });
    await wrapper.get('.toggle-btn').trigger('click');
    await wrapper.get('.delete-env-btn').trigger('click');
    expect(wrapper.get('[role="alertdialog"]').exists()).toBe(true);
    await wrapper.get('[role="alertdialog"] button').trigger('click');
    expect(wrapper.emitted('update:environments')?.at(-1)?.[0]).toEqual([]);

    const importer = mount(EnvironmentVariables, {
      props: {
        environments: [{ name: 'Dev', variables: [] }],
        currentEnvironment: 'Dev',
      },
    });
    await importer.get('.toggle-btn').trigger('click');
    await importer.get('.import-btn').trigger('click');
    await importer.get('.import-textarea').setValue('{"name":"Prod","variables":[]}');
    await importer.get('.modal-footer .confirm-btn').trigger('click');
    const imported = importer.emitted('update:environments')?.at(-1)?.[0] as Array<{
      name: string;
      variables: unknown[];
    }>;
    expect(imported.at(-1)).toEqual({ name: 'Prod', variables: [] });
    expect(importer.emitted('feedback')?.at(-1)).toEqual(['环境已导入', 'success']);
  });
});
