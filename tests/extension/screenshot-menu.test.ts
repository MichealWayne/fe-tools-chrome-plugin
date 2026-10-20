import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

const readScript = (name: string) => readFileSync(`public/scripts/${name}`, 'utf8');
function setup() {
  let installed: () => void;
  let click: (data: { menuItemId: string }, tab: unknown) => void;
  const messages = JSON.parse(readFileSync('public/_locales/zh_CN/messages.json', 'utf8'));
  const api = {
    runtime: {
      getURL: (url: string) => `chrome-extension://extension/${url}`,
      onInstalled: {
        addListener: (fn: typeof installed) => {
          installed = fn;
        },
      },
    },
    contextMenus: {
      create: vi.fn(),
      removeAll: (callback: () => void) => callback(),
      onClicked: {
        addListener: (fn: typeof click) => {
          click = fn;
        },
      },
    },
    tabs: { create: vi.fn().mockResolvedValue({ id: 55 }), sendMessage: vi.fn() },
    scripting: { executeScript: vi.fn().mockResolvedValue([]) },
    notifications: { create: vi.fn().mockResolvedValue('notification') },
    i18n: { getMessage: (key: string) => messages[key].message },
  };
  const navigate = vi.fn();
  const context = createContext({
    chrome: api,
    Date,
    MAIN_MENU_ID: 'fe-tools-main',
    ensureCodexQuotaAlarm: vi.fn(),
    handleTabCreate: navigate,
  });
  runInContext(readScript('screenshot-menu.js'), context);
  const source = readScript('backgroundV3.js');
  runInContext(
    source.slice(
      source.indexOf('const CONFIG_LIST ='),
      source.indexOf('// 监听来自 content script 的消息')
    ),
    context
  );
  return {
    api,
    navigate,
    install: () => installed(),
    click: (id: string, tab: unknown) => click({ menuItemId: id }, tab),
  };
}
const page = { id: 12, windowId: 7, url: 'https://example.test' };

describe('screenshot context menu', () => {
  it('registers two localized entries under the existing menu on supported pages', () => {
    const { api, install } = setup();
    install();
    expect(api.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'screenshotElement',
        parentId: 'fe-tools-main',
        title: '选择元素截图…',
        documentUrlPatterns: ['http://*/*', 'https://*/*'],
      })
    );
    expect(api.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'screenshotFullPage',
        title: '截取完整页面（含滚动区域）',
      })
    );
    for (const language of ['en', 'zh_CN']) {
      const messages = JSON.parse(
        readFileSync(`public/_locales/${language}/messages.json`, 'utf8')
      );
      expect(messages.contextMenuFullPageScreenshot.message).toBeTruthy();
      expect(messages.contextMenuElementScreenshot.message).toBeTruthy();
    }
  });

  it('injects and starts top-frame element selection on the originating tab without opening UI', async () => {
    const { api, click } = setup();
    click('screenshotElement', page);
    await flushPromises();
    expect(api.scripting.executeScript).toHaveBeenNthCalledWith(1, {
      target: { tabId: 12 },
      files: ['scripts/element-screenshot.js'],
    });
    expect(api.scripting.executeScript).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        target: { tabId: 12 },
        func: expect.any(Function),
        args: [expect.stringMatching(/^node-screenshot-/)],
      })
    );
    expect(api.tabs.create).not.toHaveBeenCalled();
  });

  it('creates an inactive full-page task bound to the clicked page', async () => {
    const { api, click } = setup();
    click('screenshotFullPage', page);
    await flushPromises();
    expect(api.tabs.create).toHaveBeenCalledWith({
      active: false,
      windowId: 7,
      url: 'chrome-extension://extension/index.html?type=page-capture&sourceTabId=12',
    });
  });

  it('reports injection failures and does not create a capture tab', async () => {
    const { api, click } = setup();
    api.scripting.executeScript.mockRejectedValue(new Error('Forbidden'));
    click('screenshotElement', page);
    await flushPromises();
    expect(api.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'basic' })
    );
    expect(api.tabs.create).not.toHaveBeenCalled();
  });
});

describe('other context tool shortcuts', () => {
  it('opens translation directly without a page content listener', () => {
    const { api, click, navigate } = setup();
    click('translate', page);
    expect(navigate).toHaveBeenCalledWith('https://fanyi.youdao.com/indexLLM.html#/');
    expect(api.tabs.sendMessage).not.toHaveBeenCalled();
  });

  it('passes the originating URL to the dedicated QR page', () => {
    const { click, navigate } = setup();
    const url = 'https://example.test/path?x=1&name=中文#fragment';
    click('qrCode', { ...page, url });
    const target = new URL(navigate.mock.calls[0][0]);
    expect(target.searchParams.get('type')).toBe('qrcode');
    expect(target.searchParams.get('url')).toBe(url);
  });

  it('registers tech-stack detection and binds the report to the originating tab', () => {
    const { api, install, click, navigate } = setup();
    install();
    expect(api.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'techStack',
        title: '技术栈检测',
        parentId: 'fe-tools-main',
        documentUrlPatterns: ['http://*/*', 'https://*/*'],
      })
    );
    click('techStack', page);
    const target = new URL(navigate.mock.calls[0][0]);
    expect(target.searchParams.get('type')).toBe('tech-stack');
    expect(target.searchParams.get('sourceTabId')).toBe('12');
    expect(target.searchParams.get('url')).toBe(page.url);
  });
});
