import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ElementPreview from '@/components/PageScreenshot/ElementPreview.vue';

const readScript = (name: string) => readFileSync(resolve('public/scripts', name), 'utf8');

function setup(activeTab = 12) {
  let listener: (message: unknown, sender: unknown, response: (value: unknown) => void) => boolean;
  let removed: (id: number) => Promise<void>;
  const records: Record<string, unknown> = {};
  const api = {
    runtime: {
      id: 'extension',
      lastError: undefined,
      onMessage: {
        addListener: (fn: typeof listener) => {
          listener = fn;
        },
      },
      getURL: (url: string) => `chrome-extension://extension/${url}`,
      sendMessage: vi.fn(),
    },
    tabs: {
      onRemoved: {
        addListener: (fn: typeof removed) => {
          removed = fn;
        },
      },
      query: vi.fn().mockResolvedValue([{ id: activeTab }]),
      captureVisibleTab: vi.fn().mockResolvedValue('data:image/png;base64,viewport'),
      create: vi.fn().mockResolvedValue({ id: 55 }),
    },
    storage: {
      session: {
        get: vi.fn(async () => ({ ...records })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(records, items);
        }),
        remove: vi.fn(async (keys: string | string[]) => {
          for (const key of Array.isArray(keys) ? keys : [keys]) delete records[key];
        }),
      },
    },
    downloads: { download: vi.fn() },
    i18n: { getUILanguage: () => 'zh_CN' },
  };
  const context = createContext({ chrome: api, crypto, Date });
  runInContext(readScript('message-contract.js'), context);
  runInContext(readScript('screenshot-runtime.js'), context);
  const background = readScript('backgroundV3.js');
  runInContext(background.slice(background.indexOf('// 监听来自 content script 的消息')), context);
  const sender = { id: 'extension', tab: { id: 12, windowId: 7 } };
  const request = (message: unknown, origin = sender) =>
    new Promise<Record<string, unknown>>(resolve => {
      listener(message, origin, value => resolve(value as Record<string, unknown>));
    });
  api.runtime.sendMessage.mockImplementation((message, callback) => {
    void request(message).then(callback);
  });
  return { api, records, request, removed: (id: number) => removed(id) };
}

afterEach(() => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  document.body.replaceChildren();
  vi.restoreAllMocks();
  window.location.search = '';
});

describe('element screenshot across the real content/background boundary', () => {
  it('accepts the content-script capture request without windowId and uses sender.tab', async () => {
    const { api, request } = setup();
    expect(await request({ action: 'captureVisibleTab' })).toMatchObject({ success: true });
    expect(api.tabs.captureVisibleTab).toHaveBeenCalledWith(7, { format: 'png' });
    expect(api.tabs.create).not.toHaveBeenCalled();
  });

  it('captures the source page rather than an inactive extension task tab', async () => {
    const { api, request } = setup();
    const origin = {
      id: 'extension',
      tab: { id: 55, windowId: 7 },
      url: 'chrome-extension://extension/index.html?type=page-capture',
    };
    expect(
      await request({ action: 'captureVisibleTab', windowId: 7, tabId: 12 }, origin)
    ).toMatchObject({ success: true });
    expect(api.tabs.captureVisibleTab).toHaveBeenCalledWith(7, { format: 'png' });
  });

  it('does not let a content script redirect captures to another tab', async () => {
    const { api, request } = setup();
    expect(await request({ action: 'captureVisibleTab', windowId: 99, tabId: 99 })).toMatchObject({
      success: true,
    });
    expect(api.tabs.captureVisibleTab).toHaveBeenCalledWith(7, { format: 'png' });
  });

  it('rejects captures when the selected tab is no longer active', async () => {
    const { api, request } = setup(99);
    expect(await request({ action: 'captureVisibleTab' })).toMatchObject({ success: false });
    expect(api.tabs.captureVisibleTab).not.toHaveBeenCalled();
  });

  it('finishes capture after setup acknowledgement, then opens preview without downloading', async () => {
    const { api, records, removed } = setup();
    const canvasContext = { drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext as never);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,cropped'
    );
    class ScreenshotImage {
      width = 1024;
      height = 768;
      onload?: () => void;
      set src(_value: string) {
        this.onload?.();
      }
    }
    const context = createContext({
      window,
      document,
      chrome: api,
      Image: ScreenshotImage,
      setTimeout,
      clearTimeout,
      requestAnimationFrame: (callback: () => void) => callback(),
    });
    runInContext(readScript('element-screenshot.js'), context);
    const owner = window as unknown as {
      FeToolsElementScreenshot: {
        start: (message: unknown, ack: (value: unknown) => void) => void;
      };
    };
    const acknowledgement = vi.fn();
    owner.FeToolsElementScreenshot.start({ filename: 'node.png' }, acknowledgement);
    expect(acknowledgement).toHaveBeenCalledWith({ success: true });
    expect(api.tabs.create).not.toHaveBeenCalled();
    const element = document.createElement('button');
    element.getBoundingClientRect = () =>
      ({ left: -10, top: 20, right: 90, bottom: 70, width: 100, height: 50 }) as DOMRect;
    document.body.append(element);
    element.click();
    await flushPromises();
    expect(api.tabs.captureVisibleTab).toHaveBeenCalledOnce();
    expect(canvasContext.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      0,
      20,
      90,
      50,
      0,
      0,
      90,
      50
    );
    expect(api.tabs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        windowId: 7,
        active: true,
        url: expect.stringContaining('type=screenshot-preview&captureId='),
      })
    );
    expect(api.downloads.download).not.toHaveBeenCalled();
    expect(Object.values(records)[0]).toMatchObject({
      dataUrl: 'data:image/png;base64,cropped',
      previewTabId: 55,
    });
    await removed(55);
    expect(Object.keys(records)).toHaveLength(0);
  });

  it('cancels selection with Escape without capturing or opening preview', async () => {
    const { api } = setup();
    const context = createContext({ window, document, chrome: api, setTimeout, clearTimeout });
    runInContext(readScript('element-screenshot.js'), context);
    const owner = window as unknown as {
      FeToolsElementScreenshot: {
        start: (message: unknown, ack: (value: unknown) => void) => void;
      };
    };
    owner.FeToolsElementScreenshot.start({ filename: 'node.png' }, vi.fn());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.getElementById('fe-tools-node-highlight')).toBeNull();
    document.body.click();
    await flushPromises();
    expect(api.tabs.captureVisibleTab).not.toHaveBeenCalled();
    expect(api.tabs.create).not.toHaveBeenCalled();
  });

  it('returns a capture failure without opening preview', async () => {
    const { api, request } = setup();
    api.tabs.captureVisibleTab.mockRejectedValue(new Error('Unavailable'));
    expect(await request({ action: 'captureVisibleTab' })).toMatchObject({ success: false });
    expect(api.tabs.create).not.toHaveBeenCalled();
  });

  it('cleans temporary data if opening the preview fails', async () => {
    const { api, request, records } = setup();
    api.tabs.create.mockRejectedValue(new Error('Closed window'));
    expect(
      await request({
        action: 'openElementScreenshotPreview',
        dataUrl: 'data:image/png;base64,x',
        filename: 'node.png',
      })
    ).toMatchObject({ success: false });
    expect(Object.keys(records)).toHaveLength(0);
  });

  it('shows the stored preview and downloads only on Save', async () => {
    const id = '00000000-0000-4000-8000-000000000001';
    window.location.search = `?captureId=${id}`;
    Object.assign(chrome, {
      storage: {
        session: {
          get: vi.fn().mockResolvedValue({
            [`element-screenshot:${id}`]: {
              dataUrl: 'data:image/png;base64,cropped',
              filename: 'node.png',
            },
          }),
        },
      },
    });
    Object.assign(chrome.runtime, { lastError: undefined });
    vi.mocked(chrome.runtime.sendMessage).mockImplementation((_message, callback) =>
      callback({ success: true, downloadId: 1 })
    );
    vi.mocked(chrome.runtime.sendMessage).mockClear();
    const wrapper = mount(ElementPreview);
    await flushPromises();
    expect(wrapper.get('img').attributes('src')).toBe('data:image/png;base64,cropped');
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    await wrapper.get('button').trigger('click');
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    await wrapper.get('button.u-btn_il').trigger('click');
    await flushPromises();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { action: 'downloadImage', dataUrl: 'data:image/png;base64,cropped', filename: 'node.png' },
      expect.any(Function)
    );
    wrapper.unmount();
  });
});
