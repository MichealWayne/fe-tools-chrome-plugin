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

    <div v-if="previewUrl" class="m-screenshot_preview">
      <p class="g-fs12 g-mb10">{{ t('pageScreenshot.previewTip') }}</p>
      <div class="m-preview_img">
        <div class="m-preview_frame">
          <image-viewer :src="previewUrl" :alt="t('pageScreenshot.previewTip')" />
        </div>
      </div>
      <div class="m-screenshot_actions g-mt20">
        <button
          class="u-btn_il g-fs14 m-screenshot_btn"
          s-color="blue"
          :disabled="isSaving"
          @click="saveScreenshot"
        >
          {{ t('pageScreenshot.saveToLocal') }}
        </button>
        <button class="u-btn_il g-fs14 m-screenshot_btn" :disabled="isSaving" @click="resetCapture">
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
import { onMounted, ref } from 'vue';
import ImageViewer from '@/components/Experience/ImageViewer.vue';
import { langManager } from '@/utils/i18n';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import ToolState from '@/components/Experience/ToolState.vue';
import { sendRuntimeMessage, sendTabMessage } from '@/extension/chrome-client';
import {
  isCaptureResponse,
  isSelectionResponse,
  type CaptureResponse,
  type SelectionResponse,
} from '@/extension/messages';
import {
  executeScriptFiles,
  getPageMetrics,
  scrollToPosition,
  setPageCaptureMode,
} from './capture-page';
import type { InlineFeedbackMessage } from '@/types/experience';

const MAX_CAPTURE_SEGMENTS = 40;
const MAX_CAPTURE_PIXELS = 25_000_000;

const t = (key: string) => langManager.t(key);

const props = defineProps({
  sourceTabId: { type: Number, default: undefined },
  back: {
    type: Function,
    default: () => undefined,
  },
});

const emit = defineEmits<{ finished: [] }>();

const previewUrl = ref('');
const isCapturing = ref(false);
const isSelecting = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const feedback = ref<InlineFeedbackMessage | null>(null);
const lastAction = ref<'capture' | 'select' | 'save'>('capture');

const handleStop = (e: Event) => {
  e.stopPropagation();
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getActiveTab = () => {
  if (props.sourceTabId !== undefined) return chrome.tabs.get(props.sourceTabId);
  return new Promise<chrome.tabs.Tab>((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs?.[0];
      if (!tab || !tab.id) {
        reject(new Error(t('pageScreenshot.errorUnavailable')));
        return;
      }
      resolve(tab);
    });
  });
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(t('pageScreenshot.errorCapture')));
    img.src = src;
  });

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
  const restoreOnPageHide = () => {
    if (restoreScroll) void restoreScroll().catch(() => undefined);
    if (captureTabId !== undefined) {
      void setPageCaptureMode(captureTabId, 'restore').catch(() => undefined);
    }
  };
  window.addEventListener('pagehide', restoreOnPageHide);

  try {
    const tab = await getActiveTab();
    const tabId = tab.id as number;
    captureTabId = tabId;
    if (props.sourceTabId !== undefined && !tab.active) {
      await chrome.tabs.update(tabId, { active: true });
    }
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
      await delay(550);
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
          tabId,
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
    window.removeEventListener('pagehide', restoreOnPageHide);
    isCapturing.value = false;
    emit('finished');
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
        'scripts/element-screenshot.js',
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
    // Selection and capture now run in the page, independently of this popup.
    window.close();
  } catch (error) {
    errorMessage.value = (error as Error)?.message || t('pageScreenshot.errorSelection');
  } finally {
    isSelecting.value = false;
  }
};

onMounted(() => {
  if (props.sourceTabId !== undefined) void startCapture();
});

const resetCapture = () => {
  previewUrl.value = '';
  errorMessage.value = '';
  feedback.value = null;
};

const retryLastAction = () => {
  errorMessage.value = '';
  if (lastAction.value === 'save') return saveScreenshot();
  return lastAction.value === 'select' ? startNodeSelect() : startCapture();
};

const saveScreenshot = async () => {
  if (!previewUrl.value || isSaving.value) return;
  isSaving.value = true;
  lastAction.value = 'save';
  errorMessage.value = '';
  feedback.value = null;
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const filename = `page-screenshot-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`;

  try {
    await chrome.downloads.download({
      url: previewUrl.value,
      saveAs: true,
      conflictAction: 'overwrite',
      filename,
    });
    feedback.value = { message: t('pageScreenshot.saveSuccess'), tone: 'success' };
  } catch {
    errorMessage.value = t('pageScreenshot.errorSave');
  } finally {
    isSaving.value = false;
  }
};
</script>

<style lang="less" scoped src="./page-screenshot.less"></style>
