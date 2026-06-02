<template>
  <section class="m-screenshot" @click.stop="handleStop">
    <header class="m-screenshot_head">
      <h2 class="g-fs18">{{ t('pageScreenshot.title') }}</h2>
    </header>

    <p v-if="errorMessage" class="m-screenshot_error g-fs12">{{ errorMessage }}</p>

    <div v-if="!previewUrl" class="m-screenshot_actions m-screenshot_actions--primary">
      <button
        class="u-btn_il g-fs14 m-screenshot_btn"
        s-color="blue"
        :disabled="isCapturing || isSelecting"
        @click="startCapture"
      >
        {{ isCapturing ? t('pageScreenshot.capturing') : t('pageScreenshot.startCapture') }}
      </button>
      <button
        class="u-btn_il g-fs14 m-screenshot_btn"
        :disabled="isCapturing || isSelecting"
        @click="startNodeSelect"
      >
        {{ isSelecting ? t('pageScreenshot.selecting') : t('pageScreenshot.selectNode') }}
      </button>
    </div>

    <p v-if="isSelecting" class="m-screenshot_tip g-fs12">{{ t('pageScreenshot.selectingTip') }}</p>

    <div v-else class="m-screenshot_preview">
      <p class="g-fs12 g-mb10">{{ t('pageScreenshot.previewTip') }}</p>
      <div class="m-preview_img">
        <div v-if="previewUrl" class="m-preview_frame">
          <img :src="previewUrl" alt="screenshot preview" />
        </div>
        <div v-else class="m-preview_empty">
          <div class="m-preview_icon" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="presentation">
              <rect
                x="12"
                y="18"
                width="40"
                height="30"
                rx="6"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
              />
              <circle cx="32" cy="33" r="8" fill="none" stroke="currentColor" stroke-width="3" />
              <path
                d="M22 18l4-6h12l4 6"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <p class="g-fs12 m-preview_title">{{ t('pageScreenshot.previewEmptyTitle') }}</p>
          <p class="g-fs12 m-preview_desc">{{ t('pageScreenshot.previewEmptyDesc') }}</p>
        </div>
      </div>
      <div class="m-screenshot_actions g-mt20">
        <button class="u-btn_il g-fs14 m-screenshot_btn" s-color="blue" @click="saveScreenshot">
          {{ t('pageScreenshot.saveToLocal') }}
        </button>
        <button class="u-btn_il g-fs14 m-screenshot_btn" @click="resetCapture">
          {{ t('pageScreenshot.retake') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
export default {
  name: 'PageScreenshot',
};
</script>

<script lang="ts" setup>
import { defineProps, ref } from 'vue';
import { langManager } from '@/utils/i18n';

const t = (key: string) => langManager.t(key);

defineProps({
  back: {
    type: Function,
    default: () => undefined,
  },
});

const previewUrl = ref('');
const isCapturing = ref(false);
const isSelecting = ref(false);
const errorMessage = ref('');

const handleStop = (e: Event) => {
  e.stopPropagation();
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getActiveTab = () =>
  new Promise<chrome.tabs.Tab>((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs?.[0];
      if (!tab || !tab.id) {
        reject(new Error(t('pageScreenshot.errorUnavailable')));
        return;
      }
      resolve(tab);
    });
  });

type PageMetrics = {
  totalWidth: number;
  totalHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  scrollY: number;
};

type CaptureResponse = {
  success: boolean;
  dataUrl?: string;
  error?: string;
};

type SelectionResponse = {
  success: boolean;
  error?: string;
};

type TabMessage =
  | { action: 'getPageMetrics' }
  | { action: 'scrollTo'; y: number; delay?: number }
  | { action: 'startElementSelectAndCapture'; filename: string };

type BackgroundMessage = {
  action: 'captureVisibleTab';
  windowId: number;
};

const sendMessageToTab = <T,>(tabId: number, message: TabMessage) =>
  new Promise<T>((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(response as T);
    });
  });

const executeScript = <T,>(tabId: number, func: (...args: unknown[]) => T, args: unknown[] = []) =>
  new Promise<T>((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func,
        args,
      },
      results => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve(results?.[0]?.result as T);
      }
    );
  });

const executeScriptFiles = (tabId: number, files: string[]) =>
  new Promise<void>((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        files,
      },
      () => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve();
      }
    );
  });

const sendMessageToBackground = <T,>(message: BackgroundMessage) =>
  new Promise<T>((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(response as T);
    });
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(t('pageScreenshot.errorCapture')));
    img.src = src;
  });

const getPageMetrics = async (tabId: number) => {
  try {
    return await sendMessageToTab<PageMetrics>(tabId, { action: 'getPageMetrics' });
  } catch {
    return executeScript(tabId, () => {
      const doc = document.documentElement;
      const body = document.body;
      return {
        totalWidth: Math.max(doc.scrollWidth, body ? body.scrollWidth : 0),
        totalHeight: Math.max(doc.scrollHeight, body ? body.scrollHeight : 0),
        viewportWidth: window.innerWidth || doc.clientWidth,
        viewportHeight: window.innerHeight || doc.clientHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        scrollY: window.scrollY || window.pageYOffset || doc.scrollTop || 0,
      };
    });
  }
};

const scrollToPosition = async (tabId: number, y: number) => {
  try {
    return await sendMessageToTab<{ scrollY: number }>(tabId, { action: 'scrollTo', y, delay: 0 });
  } catch {
    return executeScript(
      tabId,
      (targetY: unknown) => {
        window.scrollTo(0, targetY as number);
        const doc = document.documentElement;
        return {
          scrollY: window.scrollY || window.pageYOffset || doc.scrollTop || 0,
        };
      },
      [y]
    );
  }
};

type CropRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const captureFullPage = async (cropRect?: CropRect) => {
  errorMessage.value = '';
  previewUrl.value = '';
  isCapturing.value = true;

  try {
    const tab = await getActiveTab();
    const tabId = tab.id as number;
    const metrics = await getPageMetrics(tabId);

    if (!metrics || !metrics.totalHeight || !metrics.viewportHeight) {
      throw new Error(t('pageScreenshot.errorUnavailable'));
    }

    const { totalHeight, viewportHeight, viewportWidth, scrollY } = metrics;

    const maxScroll = Math.max(0, totalHeight - viewportHeight);
    const positions: number[] = [];
    let current = 0;
    while (current <= maxScroll) {
      positions.push(current);
      current += viewportHeight;
    }
    if (positions[positions.length - 1] !== maxScroll) {
      positions.push(maxScroll);
    }

    const captures: Array<{ y: number; dataUrl: string }> = [];
    for (const y of positions) {
      await scrollToPosition(tabId, y);
      await delay(200);
      const captureResponse = await sendMessageToBackground<CaptureResponse>({
        action: 'captureVisibleTab',
        windowId: tab.windowId,
      });

      if (!captureResponse?.success || !captureResponse.dataUrl) {
        throw new Error(captureResponse?.error || t('pageScreenshot.errorCapture'));
      }

      captures.push({ y, dataUrl: captureResponse.dataUrl });
    }

    await scrollToPosition(tabId, scrollY);

    const images = await Promise.all(captures.map(item => loadImage(item.dataUrl)));
    const scale = images[0].width / viewportWidth;
    const canvas = document.createElement('canvas');
    canvas.width = images[0].width;
    canvas.height = Math.round(totalHeight * scale);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error(t('pageScreenshot.errorCapture'));
    }

    images.forEach((img, index) => {
      const offsetY = Math.round(captures[index].y * scale);
      ctx.drawImage(img, 0, offsetY);
    });

    if (cropRect) {
      const sx = Math.max(0, Math.round(cropRect.left * scale));
      const sy = Math.max(0, Math.round(cropRect.top * scale));
      const sw = Math.max(0, Math.round(cropRect.width * scale));
      const sh = Math.max(0, Math.round(cropRect.height * scale));

      if (!sw || !sh) {
        throw new Error(t('pageScreenshot.errorSelection'));
      }

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = Math.min(sw, canvas.width - sx);
      cropCanvas.height = Math.min(sh, canvas.height - sy);
      const cropCtx = cropCanvas.getContext('2d');

      if (!cropCtx) {
        throw new Error(t('pageScreenshot.errorCapture'));
      }

      cropCtx.drawImage(
        canvas,
        sx,
        sy,
        cropCanvas.width,
        cropCanvas.height,
        0,
        0,
        cropCanvas.width,
        cropCanvas.height
      );
      previewUrl.value = cropCanvas.toDataURL('image/png');
    } else {
      previewUrl.value = canvas.toDataURL('image/png');
    }
  } catch (error) {
    errorMessage.value = (error as Error)?.message || t('pageScreenshot.errorCapture');
  } finally {
    isCapturing.value = false;
  }
};

const startCapture = () => captureFullPage();

const startNodeSelect = async () => {
  errorMessage.value = '';
  previewUrl.value = '';
  isSelecting.value = true;

  try {
    const tab = await getActiveTab();
    const tabId = tab.id as number;
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const filename = `node-screenshot-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
      now.getDate()
    )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`;
    let selection: SelectionResponse | undefined;
    try {
      selection = await sendMessageToTab<SelectionResponse>(tabId, {
        action: 'startElementSelectAndCapture',
        filename,
      });
    } catch (error) {
      const message = (error as Error)?.message || '';
      if (!message.includes('Receiving end does not exist')) {
        throw error;
      }
      await executeScriptFiles(tabId, ['scripts/content-script-v3.js']);
      selection = await sendMessageToTab<SelectionResponse>(tabId, {
        action: 'startElementSelectAndCapture',
        filename,
      });
    }

    if (!selection?.success) {
      throw new Error(selection?.error || t('pageScreenshot.errorSelection'));
    }
  } catch (error) {
    errorMessage.value = (error as Error)?.message || t('pageScreenshot.errorSelection');
  } finally {
    isSelecting.value = false;
  }
};

const resetCapture = () => {
  previewUrl.value = '';
  errorMessage.value = '';
};

const saveScreenshot = () => {
  if (!previewUrl.value) return;
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const filename = `page-screenshot-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`;

  try {
    chrome.downloads.download({
      url: previewUrl.value,
      saveAs: true,
      conflictAction: 'overwrite',
      filename,
    });
  } catch (error) {
    errorMessage.value = (error as Error)?.message || t('pageScreenshot.errorCapture');
  }
};
</script>

<style lang="less" scoped src="./page-screenshot.less"></style>
