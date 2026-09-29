import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PostManMain from '@/components/PostMan/PostManMain.vue';
import RequestBody from '@/components/PostMan/RequestBody.vue';
import RequestHistory from '@/components/PostMan/RequestHistory.vue';
import EnvironmentVariables from '@/components/PostMan/EnvironmentVariables.vue';
import ResponseViewer from '@/components/PostMan/ResponseViewer.vue';
import { useRequestExecution } from '@/components/PostMan/composables/useRequestExecution';
import type { PostmanRequestConfig } from '@/components/PostMan/types';
import SavedRequests from '@/components/PostMan/SavedRequests.vue';
import CurlTools from '@/components/PostMan/CurlTools.vue';

const { axiosRequest } = vi.hoisted(() => ({ axiosRequest: vi.fn() }));
vi.mock('axios', () => ({
  default: Object.assign(axiosRequest, {
    isAxiosError: vi.fn((error: { isAxiosError?: boolean }) => Boolean(error?.isAxiosError)),
  }),
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

  it('opens the drawer with focus and closes it with Escape', async () => {
    const wrapper = mount(PostManMain, { attachTo: document.body });
    const management = wrapper.get('.postman-management').element as HTMLDetailsElement;
    management.open = true;
    await wrapper.get('.toolbar-btn').trigger('click');
    await wrapper.vm.$nextTick();
    expect(management.open).toBe(false);
    const drawer = wrapper.get('.postman-drawer').element;
    expect(document.activeElement).toBe(drawer);

    await wrapper.get('.postman-drawer').trigger('keydown.esc');
    expect(wrapper.find('.postman-drawer').exists()).toBe(false);
    wrapper.unmount();
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

  it('does not execute JavaScript-like JSON responses as a parsing fallback', async () => {
    const wrapper = mount(ResponseViewer, {
      props: {
        response: {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          data: '{unquoted: true}',
          responseTime: 12,
          size: 16,
        },
      },
    });

    await wrapper.setProps({
      response: {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: '{unquoted: true}',
        responseTime: 12,
        size: 16,
      },
    });
    await flushPromises();

    expect(wrapper.text()).toMatch(/JSON/);
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

  it('shows explicit response lifecycle states', () => {
    const pending = mount(ResponseViewer, {
      props: { executionState: { type: 'pending', startedAt: Date.now() } },
    });
    expect(pending.get('[data-state="pending"]').text()).toContain('等待');

    const failed = mount(ResponseViewer, {
      props: { executionState: { type: 'network-error', message: 'offline' } },
    });
    expect(failed.text()).toContain('offline');
  });

  it('offers raw and sanitized preview modes for HTML responses', async () => {
    const wrapper = mount(ResponseViewer, {
      props: {
        response: {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'text/html' },
          data: '<img src=x onerror=alert(1)><script>alert(1)</script><b>safe</b>',
          responseTime: 10,
          size: 50,
        },
      },
    });
    const preview = wrapper.findAll('.view-modes button').find(button => button.text() === '预览');
    await preview?.trigger('click');
    expect(wrapper.get('.html-preview').html()).toContain('<b>safe</b>');
    expect(wrapper.get('.html-preview').html()).not.toContain('onerror');
    expect(wrapper.get('.html-preview').html()).not.toContain('<script');
  });

  it('cancels an active request as a distinct lifecycle state', async () => {
    axiosRequest.mockImplementation(
      ({ signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener('abort', () => reject(new Error('aborted')))
        )
    );
    const lifecycle = useRequestExecution();
    const request: PostmanRequestConfig = {
      method: 'GET',
      url: 'https://api.test',
      headers: [],
      body: { type: 'none' },
      auth: { type: 'none' },
    };
    const pending = lifecycle.execute(request, value => value);
    lifecycle.cancel();
    await pending;
    expect(lifecycle.state.value.type).toBe('cancelled');
  });

  it('classifies timeout, network failure, and HTTP error responses', async () => {
    const request: PostmanRequestConfig = {
      method: 'GET',
      url: 'https://api.test',
      headers: [],
      body: { type: 'none' },
      auth: { type: 'none' },
      settings: { timeout: 10 },
    };
    const timeout = useRequestExecution();
    axiosRequest.mockRejectedValueOnce({ isAxiosError: true, code: 'ECONNABORTED' });
    await timeout.execute(request, value => value);
    expect(timeout.state.value.type).toBe('timeout');

    const network = useRequestExecution();
    axiosRequest.mockRejectedValueOnce({ isAxiosError: true, message: 'offline' });
    await network.execute(request, value => value);
    expect(network.state.value).toMatchObject({ type: 'network-error', message: 'offline' });

    const httpError = useRequestExecution();
    axiosRequest.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 422, statusText: 'Invalid', headers: {}, data: { issue: true } },
    });
    await httpError.execute(request, value => value);
    expect(httpError.state.value).toMatchObject({
      type: 'received',
      response: { status: 422, data: { issue: true } },
    });
  });

  it('searches and downloads response content', async () => {
    const wrapper = mount(ResponseViewer, {
      props: {
        response: {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'text/plain', 'x-test': 'copy-me' },
          data: 'hello hello',
          responseTime: 1,
          size: 11,
        },
      },
    });
    await wrapper.get('.response-search input').setValue('hello');
    expect(wrapper.get('.response-search').text()).toContain('1/2');
    await wrapper.get('.utility-btn').trigger('click');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('saves named requests with duplicate confirmation and redaction', async () => {
    const request: PostmanRequestConfig = {
      method: 'GET',
      url: 'https://api.test',
      headers: [],
      body: { type: 'none' },
      auth: { type: 'bearer', token: 'secret' },
    };
    const wrapper = mount(SavedRequests, { props: { items: [], request } });
    await wrapper.get('.save-form input').setValue('Users');
    await wrapper.get('.save-form').trigger('submit');
    const saved = wrapper.emitted('update:items')?.[0]?.[0] as Array<{
      request: PostmanRequestConfig;
      redacted: boolean;
    }>;
    expect(saved[0].redacted).toBe(true);
    expect(saved[0].request.auth.token).toBe('');

    await wrapper.setProps({ items: saved as never });
    await wrapper.get('.save-form input').setValue('Users');
    await wrapper.get('.save-form').trigger('submit');
    expect(wrapper.get('[role="alertdialog"]').exists()).toBe(true);
  });

  it('previews cURL imports before applying them', async () => {
    const request: PostmanRequestConfig = {
      method: 'GET',
      url: 'https://current.test',
      headers: [],
      body: { type: 'none' },
      auth: { type: 'none' },
    };
    const wrapper = mount(CurlTools, { props: { request } });
    await wrapper.get('#curl-import').setValue('curl https://api.test');
    await wrapper.findAll('button')[0].trigger('click');
    expect(wrapper.get('.curl-preview').text()).toContain('https://api.test');
    await wrapper.get('.curl-preview button').trigger('click');
    expect(wrapper.emitted('apply')?.[0]?.[0]).toMatchObject({ url: 'https://api.test' });
  });
});
