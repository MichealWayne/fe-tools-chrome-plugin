import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isBackgroundMessage,
  isCaptureResponse,
  isPageMetrics,
  isRuntimeMessage,
  isTabMessage,
} from '@/extension/messages';
import { sendRuntimeMessage, sendTabMessage } from '@/extension/chrome-client';

describe('Chrome message contracts', () => {
  beforeEach(() => {
    Object.assign(chrome.tabs, { sendMessage: vi.fn() });
    Object.assign(chrome.runtime, { lastError: undefined });
  });

  it('accepts supported requests and rejects malformed payloads', () => {
    expect(isTabMessage({ action: 'getPageMetrics' })).toBe(true);
    expect(isTabMessage({ action: 'scrollTo', y: 120, delay: 0 })).toBe(true);
    expect(isTabMessage({ action: 'scrollTo', y: '120' })).toBe(false);
    expect(isTabMessage({ action: 'startElementSelectAndCapture', filename: '' })).toBe(false);

    expect(isBackgroundMessage({ action: 'captureVisibleTab', windowId: 1 })).toBe(true);
    expect(
      isBackgroundMessage({ action: 'downloadImage', dataUrl: 'data:image/png;base64,x' })
    ).toBe(true);
    expect(isBackgroundMessage({ action: 'downloadImage', dataUrl: '' })).toBe(false);

    expect(isRuntimeMessage({ action: 'getCodexQuota' })).toBe(true);
    expect(isRuntimeMessage({ action: 'handleTabCreate', url: 'index.html' })).toBe(true);
    expect(isRuntimeMessage({ action: 'executeScriptAndHandleTabCreate', type: 'unknown' })).toBe(
      false
    );
  });

  it('validates typed responses and propagates Chrome runtime errors', async () => {
    vi.mocked(chrome.tabs.sendMessage).mockImplementation((_tabId, _message, callback) => {
      callback({
        totalWidth: 100,
        totalHeight: 200,
        viewportWidth: 100,
        viewportHeight: 100,
        devicePixelRatio: 1,
        scrollY: 0,
      });
    });
    await expect(
      sendTabMessage(1, { action: 'getPageMetrics' }, isPageMetrics)
    ).resolves.toMatchObject({ totalHeight: 200 });

    vi.mocked(chrome.runtime.sendMessage).mockImplementation((_message, callback) => {
      callback({ success: true, dataUrl: 'data:image/png;base64,x' });
    });
    await expect(
      sendRuntimeMessage({ action: 'captureVisibleTab', windowId: 1 }, isCaptureResponse)
    ).resolves.toMatchObject({ success: true });

    vi.mocked(chrome.runtime.sendMessage).mockImplementation((_message, callback) => {
      callback({ success: 'yes' });
    });
    await expect(
      sendRuntimeMessage({ action: 'captureVisibleTab', windowId: 1 }, isCaptureResponse)
    ).rejects.toThrow('Invalid response');

    Object.assign(chrome.runtime, { lastError: { message: 'Receiving end does not exist' } });
    await expect(
      sendRuntimeMessage({ action: 'captureVisibleTab', windowId: 1 }, isCaptureResponse)
    ).rejects.toThrow('Receiving end does not exist');
  });
});
