<template>
  <section class="m-screenshot" @click.stop="handleStop">
    <tool-state
      v-if="errorMessage"
      state="error"
      :message="errorMessage"
      :action-label="t('experience.retry')"
      @action="retryLastAction"
    />
    <tool-state
      v-else-if="isCapturing || isSelecting"
      state="loading"
      :message="isSelecting ? t('pageScreenshot.selecting') : t('pageScreenshot.capturing')"
    />
    <inline-feedback :feedback="feedback" />

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
      <p v-if="previewUrl" class="g-fs12 g-mb10">{{ t('pageScreenshot.previewTip') }}</p>
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
import { ref } from 'vue';
import { langManager } from '@/utils/i18n';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import ToolState from '@/components/Experience/ToolState.vue';
import { sendRuntimeMessage, sendTabMessage } from '@/extension/chrome-client';
import {
  isCaptureResponse,
  isPageMetrics,
  isScrollResponse,
  isSelectionResponse,
  type CaptureResponse,
  type PageMetrics,
  type SelectionResponse,
} from '@/extension/messages';
import type { InlineFeedbackMessage } from '@/types/experience';

const MAX_CAPTURE_SEGMENTS = 40;
const MAX_CAPTURE_PIXELS = 25_000_000;

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
const feedback = ref<InlineFeedbackMessage | null>(null);
const lastAction = ref<'capture' | 'select'>('capture');

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

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(t('pageScreenshot.errorCapture')));
    img.src = src;
  });

const getPageMetrics = async (tabId: number) => {
  try {
    return await sendTabMessage<PageMetrics>(tabId, { action: 'getPageMetrics' }, isPageMetrics);
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
    return await sendTabMessage<{ scrollY: number }>(
      tabId,
      { action: 'scrollTo', y, delay: 0 },
      isScrollResponse
    );
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

const setPageCaptureMode = async (tabId: number, mode: 'prepare' | 'segment' | 'restore') =>
  executeScript(
    tabId,
    (action: unknown) => {
      const styleId = 'fe-tools-capture-style';
      const marker = 'data-fe-tools-capture-kind';
      const hidden = 'data-fe-tools-capture-hidden';
      if (action === 'restore') {
        document.querySelectorAll(`[${marker}]`).forEach(node => {
          node.removeAttribute(marker);
          node.removeAttribute('data-fe-tools-capture-top');
          node.removeAttribute(hidden);
        });
        document.getElementById(styleId)?.remove();
        return;
      }
      if (action === 'prepare') {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `html { scroll-behavior: auto !important; } [${hidden}] { visibility: hidden !important; }`;
        document.documentElement.appendChild(style);
        return;
      }
      if (window.scrollY === 0) {
        document.querySelectorAll('*').forEach(node => {
          const element = node as HTMLElement;
          const position = getComputedStyle(element).position;
          if (position !== 'fixed' && position !== 'sticky') return;
          element.setAttribute(marker, position);
          element.setAttribute(
            'data-fe-tools-capture-top',
            String(element.getBoundingClientRect().top)
          );
        });
      }
      document.querySelectorAll(`[${marker}]`).forEach(node => {
        const element = node as HTMLElement;
        const kind = element.getAttribute(marker);
        const naturalTop = Number(element.getAttribute('data-fe-tools-capture-top'));
        const stickyTop = parseFloat(getComputedStyle(element).top) || 0;
        const isStuck =
          kind === 'sticky' &&
          window.scrollY > naturalTop &&
          element.getBoundingClientRect().top <= stickyTop + 2;
        if (window.scrollY > 0 && (kind === 'fixed' || isStuck)) {
          element.setAttribute(hidden, '');
        } else {
          element.removeAttribute(hidden);
        }
      });
    },
    [mode]
  );

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
  let restoreScroll: (() => Promise<unknown>) | undefined;
  let captureTabId: number | undefined;

  try {
    const tab = await getActiveTab();
    const tabId = tab.id as number;
    captureTabId = tabId;
    const metrics = await getPageMetrics(tabId);

    if (!metrics || !metrics.totalHeight || !metrics.viewportHeight) {
      throw new Error(t('pageScreenshot.errorUnavailable'));
    }

    const { totalHeight, viewportHeight, viewportWidth, devicePixelRatio, scrollY } = metrics;
    restoreScroll = () => scrollToPosition(tabId, scrollY);

    const captures: Array<{ y: number; dataUrl: string }> = [];
    let capturedHeight = totalHeight;
    let y = 0;
    await setPageCaptureMode(tabId, 'prepare');
    while (captures.length < MAX_CAPTURE_SEGMENTS) {
      const position = await scrollToPosition(tabId, y);
      await delay(200);
      await setPageCaptureMode(tabId, 'segment');
      const currentMetrics = await getPageMetrics(tabId);
      capturedHeight = Math.max(capturedHeight, currentMetrics.totalHeight);
      const estimatedPixels = capturedHeight * viewportWidth * Math.max(1, devicePixelRatio) ** 2;
      if (estimatedPixels > MAX_CAPTURE_PIXELS) {
        throw new Error(t('pageScreenshot.errorTooLarge'));
      }
      const captureResponse = await sendRuntimeMessage<CaptureResponse>(
        {
          action: 'captureVisibleTab',
          windowId: tab.windowId,
        },
        isCaptureResponse
      );

      if (!captureResponse?.success || !captureResponse.dataUrl) {
        throw new Error(captureResponse?.error || t('pageScreenshot.errorCapture'));
      }

      captures.push({ y: position.scrollY, dataUrl: captureResponse.dataUrl });
      let latestMetrics = await getPageMetrics(tabId);
      capturedHeight = Math.max(capturedHeight, latestMetrics.totalHeight);
      let maxScroll = Math.max(0, capturedHeight - viewportHeight);
      if (position.scrollY >= maxScroll) {
        await delay(250);
        latestMetrics = await getPageMetrics(tabId);
        capturedHeight = Math.max(capturedHeight, latestMetrics.totalHeight);
        maxScroll = Math.max(0, capturedHeight - viewportHeight);
        if (position.scrollY >= maxScroll) break;
      }
      y = Math.min(position.scrollY + viewportHeight, maxScroll);
      if (y <= position.scrollY) throw new Error(t('pageScreenshot.errorCapture'));
    }
    if (
      captures.length === MAX_CAPTURE_SEGMENTS &&
      captures[captures.length - 1].y < capturedHeight - viewportHeight
    )
      throw new Error(t('pageScreenshot.errorTooLarge'));

    await restoreScroll();
    restoreScroll = undefined;
    await setPageCaptureMode(tabId, 'restore');
    captureTabId = undefined;

    const firstImage = await loadImage(captures[0].dataUrl);
    captures[0].dataUrl = '';
    const scale = firstImage.width / viewportWidth;
    const canvasHeight = Math.round(capturedHeight * scale);
    if (firstImage.width * canvasHeight > MAX_CAPTURE_PIXELS) {
      throw new Error(t('pageScreenshot.errorTooLarge'));
    }
    const canvas = document.createElement('canvas');
    canvas.width = firstImage.width;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error(t('pageScreenshot.errorCapture'));
    }

    for (const [index, capture] of captures.entries()) {
      const img = index === 0 ? firstImage : await loadImage(capture.dataUrl);
      capture.dataUrl = '';
      const offsetY = Math.round(capture.y * scale);
      ctx.drawImage(img, 0, offsetY);
      img.src = '';
    }

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
    if (restoreScroll) {
      try {
        await restoreScroll();
      } catch {
        // Preserve the original screenshot failure; restoring the page is best effort.
      }
    }
    if (captureTabId !== undefined) {
      try {
        await setPageCaptureMode(captureTabId, 'restore');
      } catch {
        // The tab may have closed while the capture was in progress.
      }
    }
    isCapturing.value = false;
  }
};

const startCapture = () => {
  lastAction.value = 'capture';
  feedback.value = null;
  return captureFullPage();
};

const startNodeSelect = async () => {
  lastAction.value = 'select';
  feedback.value = null;
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
      selection = await sendTabMessage<SelectionResponse>(
        tabId,
        { action: 'startElementSelectAndCapture', filename },
        isSelectionResponse
      );
    } catch (error) {
      const message = (error as Error)?.message || '';
      if (!message.includes('Receiving end does not exist')) {
        throw error;
      }
      await executeScriptFiles(tabId, [
        'scripts/message-contract.js',
        'scripts/content-script-v3.js',
      ]);
      selection = await sendTabMessage<SelectionResponse>(
        tabId,
        { action: 'startElementSelectAndCapture', filename },
        isSelectionResponse
      );
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
  feedback.value = null;
};

const retryLastAction = () => {
  errorMessage.value = '';
  return lastAction.value === 'select' ? startNodeSelect() : startCapture();
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
    feedback.value = { message: t('pageScreenshot.saveSuccess'), tone: 'success' };
  } catch (error) {
    errorMessage.value = (error as Error)?.message || t('pageScreenshot.errorCapture');
  }
};
</script>

<style lang="less" scoped src="./page-screenshot.less"></style>
