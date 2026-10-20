import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FullPageCapture from '@/components/PageScreenshot/FullPageCapture.vue';
import { sendRuntimeMessage } from '@/extension/chrome-client';
import {
  getPageMetrics,
  scrollToPosition,
  setPageCaptureMode,
} from '@/components/PageScreenshot/capture-page';

vi.mock('@/extension/chrome-client', () => ({
  sendRuntimeMessage: vi
    .fn()
    .mockResolvedValue({ success: true, dataUrl: 'data:image/png;base64,segment' }),
  sendTabMessage: vi.fn(),
}));
vi.mock('@/components/PageScreenshot/capture-page', () => ({
  getPageMetrics: vi.fn().mockResolvedValue({
    totalWidth: 200,
    totalHeight: 2500,
    viewportWidth: 200,
    viewportHeight: 1000,
    devicePixelRatio: 1,
    scrollY: 175,
  }),
  scrollToPosition: vi.fn(async (_tabId: number, y: number) => ({ scrollY: y })),
  setPageCaptureMode: vi.fn().mockResolvedValue(undefined),
  executeScriptFiles: vi.fn(),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(getPageMetrics).mockResolvedValue({
    totalWidth: 200,
    totalHeight: 2500,
    viewportWidth: 200,
    viewportHeight: 1000,
    devicePixelRatio: 1,
    scrollY: 175,
  });
  vi.mocked(scrollToPosition).mockImplementation(async (_tabId, y) => ({ scrollY: y }));
  vi.mocked(setPageCaptureMode).mockResolvedValue(undefined);
  vi.mocked(sendRuntimeMessage).mockResolvedValue({
    success: true,
    dataUrl: 'data:image/png;base64,segment',
  });
  window.location.search = '?type=page-capture&sourceTabId=12';
  Object.assign(chrome.tabs, {
    get: vi.fn().mockResolvedValue({ id: 12, windowId: 7, active: true }),
    getCurrent: vi.fn().mockResolvedValue({ id: 55 }),
    update: vi.fn().mockResolvedValue({}),
  });
  Object.assign(chrome, { downloads: { download: vi.fn() } });
  class ScreenshotImage {
    width = 200;
    height = 1000;
    onload?: () => void;
    set src(value: string) {
      if (value) Promise.resolve().then(() => this.onload?.());
    }
  }
  vi.stubGlobal('Image', ScreenshotImage);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,full');
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.location.search = '';
});

describe('full-page context capture task', () => {
  it('keeps the preview and reports a rejected download instead of success', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as never);
    const wrapper = mount(FullPageCapture);
    try {
      await flushPromises();
      await vi.runAllTimersAsync();
      await flushPromises();
      const rejected = Promise.reject(new Error('download rejected'));
      void rejected.catch(() => {});
      vi.mocked(chrome.downloads.download).mockReturnValueOnce(rejected);
      await wrapper
        .findAll('.m-screenshot_btn')
        .find(button => button.text() === '保存到本地')!
        .trigger('click');
      await flushPromises();
      expect(wrapper.get('.tool-state--error').text()).toContain('截图保存失败');
      expect(wrapper.text()).not.toContain('截图已提交保存');
      expect(wrapper.get('img').attributes('src')).toBe('data:image/png;base64,full');
    } finally {
      wrapper.unmount();
    }
  });
  it('waits for download acceptance, handles rejection, and retries saving without recapturing', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as never);
    const wrapper = mount(FullPageCapture);
    try {
      await flushPromises();
      await vi.runAllTimersAsync();
      await flushPromises();
      let rejectDownload!: (reason: Error) => void;
      const pending = new Promise<number>((_resolve, reject) => {
        rejectDownload = reject;
      });
      // Keep the original implementation's detached rejection from escaping the regression test.
      void pending.catch(() => {});
      vi.mocked(chrome.downloads.download).mockReturnValueOnce(pending);
      const save = wrapper
        .findAll('.m-screenshot_btn')
        .find(button => button.text() === '保存到本地')!;
      expect(save).toBeTruthy();
      await save.trigger('click');
      expect(wrapper.text()).not.toContain('截图已提交保存');
      expect(save.attributes('disabled')).toBeDefined();
      expect(
        wrapper
          .findAll('.m-screenshot_btn')
          .find(button => button.text() === '重新截图')!
          .attributes('disabled')
      ).toBeDefined();
      await save.trigger('click');
      expect(chrome.downloads.download).toHaveBeenCalledTimes(1);
      rejectDownload(new Error('download rejected'));
      await flushPromises();
      expect(wrapper.find('.tool-state--error').exists()).toBe(true);
      expect(wrapper.text()).not.toContain('截图已提交保存');
      expect(wrapper.get('img').attributes('src')).toBe('data:image/png;base64,full');
      const captureCount = vi.mocked(sendRuntimeMessage).mock.calls.length;
      vi.mocked(chrome.downloads.download).mockResolvedValueOnce(42);
      await wrapper.get('.tool-state__action').trigger('click');
      await flushPromises();
      expect(chrome.downloads.download).toHaveBeenCalledTimes(2);
      expect(sendRuntimeMessage).toHaveBeenCalledTimes(captureCount);
      expect(wrapper.find('.tool-state--error').exists()).toBe(false);
      expect(wrapper.text()).toContain('截图已提交保存');
      vi.mocked(chrome.downloads.download).mockRejectedValueOnce(new Error('another failure'));
      await save.trigger('click');
      await flushPromises();
      expect(wrapper.get('.tool-state--error').text()).toContain('截图保存失败');
      expect(wrapper.text()).not.toContain('截图已提交保存');
    } finally {
      wrapper.unmount();
    }
  });
  it('stitches all vertical segments and restores the page before activating preview', async () => {
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as never);
    const wrapper = mount(FullPageCapture);
    await flushPromises();
    expect(chrome.tabs.update).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    await flushPromises();
    expect(sendRuntimeMessage).toHaveBeenCalledTimes(3);
    expect(sendRuntimeMessage).toHaveBeenCalledWith(
      { action: 'captureVisibleTab', windowId: 7, tabId: 12 },
      expect.any(Function)
    );
    expect(drawImage.mock.calls.map(call => call[2])).toEqual([0, 1000, 1500]);
    expect(scrollToPosition).toHaveBeenLastCalledWith(12, 175);
    expect(setPageCaptureMode).toHaveBeenLastCalledWith(12, 'restore');
    expect(chrome.tabs.update).toHaveBeenCalledWith(55, { active: true });
    expect(vi.mocked(chrome.tabs.update).mock.invocationCallOrder[0]).toBeGreaterThan(
      vi.mocked(setPageCaptureMode).mock.invocationCallOrder.at(-1)!
    );
    expect(wrapper.get('img').attributes('src')).toBe('data:image/png;base64,full');
    wrapper.unmount();
  });

  it('restores page state and shows an error when capture fails', async () => {
    vi.mocked(sendRuntimeMessage).mockResolvedValueOnce({ success: false, error: 'Inactive page' });
    const wrapper = mount(FullPageCapture);
    await flushPromises();
    await vi.runAllTimersAsync();
    await flushPromises();
    expect(scrollToPosition).toHaveBeenLastCalledWith(12, 175);
    expect(setPageCaptureMode).toHaveBeenLastCalledWith(12, 'restore');
    expect(chrome.tabs.update).toHaveBeenCalledWith(55, { active: true });
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.get('.tool-state--error').text()).toContain('Inactive page');
    wrapper.unmount();
  });
});
