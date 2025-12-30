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
              <rect x="12" y="18" width="40" height="30" rx="6" fill="none" stroke="currentColor" stroke-width="3" />
              <circle cx="32" cy="33" r="8" fill="none" stroke="currentColor" stroke-width="3" />
              <path d="M22 18l4-6h12l4 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
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

    <p class="m-screenshot_back g-mt30 f-tc g-fs14" s-cr_blue @click="back">
      {{ t('common.backHome') }}
    </p>
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

const { back } = defineProps({
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

const sendMessageToTab = (tabId: number, message: any) =>
  new Promise<any>((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(response);
    });
  });

const executeScript = <T,>(tabId: number, func: (...args: any[]) => T, args: any[] = []) =>
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

const sendMessageToBackground = (message: any) =>
  new Promise<any>((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(response);
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
    return await sendMessageToTab(tabId, { action: 'getPageMetrics' });
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
    return await sendMessageToTab(tabId, { action: 'scrollTo', y, delay: 0 });
  } catch {
    return executeScript(tabId, targetY => {
      window.scrollTo(0, targetY);
      const doc = document.documentElement;
      return {
        scrollY: window.scrollY || window.pageYOffset || doc.scrollTop || 0,
      };
    }, [y]);
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

    const {
      totalHeight,
      viewportHeight,
      viewportWidth,
      scrollY,
    } = metrics;

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
      const captureResponse = await sendMessageToBackground({
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
    const selection = await sendMessageToTab(tabId, {
      action: 'startElementSelectAndCapture',
      filename,
    });

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

<style lang="less" scoped>
.m-screenshot {
  width: 780px;
  max-height: 460px;
  overflow: auto;
  padding: 22px 26px 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f8ff 100%);
  border: 1px solid #e2e9ff;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(30, 74, 173, 0.12);
  display: flex;
  flex-direction: column;
}

.m-screenshot_head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.m-screenshot_head h2 {
  font-weight: 600;
  color: #1f2a44;
  letter-spacing: 0.2px;
}

.m-screenshot_error {
  color: #c0392b;
  margin-bottom: 12px;
  background: #fff0f0;
  border: 1px solid #ffd6d6;
  border-radius: 8px;
  padding: 8px 12px;
}

.m-screenshot_actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.m-screenshot_actions--primary {
  margin: 18px 0 6px;
}

.m-screenshot_btn {
  min-width: 150px;
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid #dbe3f9;
  background: #fff;
  color: #2b3a55;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease,
    color 0.15s ease, border-color 0.15s ease;
  box-shadow: 0 6px 14px rgba(28, 63, 124, 0.08);
}

.m-screenshot_btn:hover {
  transform: translateY(-1px);
  border-color: #b9c7ef;
}

.m-screenshot_btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.m-screenshot_btn[s-color='blue'] {
  background: linear-gradient(135deg, #2969f7 0%, #4d7fff 100%);
  border-color: #2c66f7;
  color: #fff;
  box-shadow: 0 10px 18px rgba(41, 105, 247, 0.25);
}

.m-screenshot_btn[s-color='blue']:hover {
  box-shadow: 0 14px 24px rgba(41, 105, 247, 0.32);
}

.m-screenshot_tip {
  margin-top: 12px;
  text-align: center;
  color: #6b7a99;
}

.m-screenshot_preview {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  width: 100%;
}

.m-preview_img {
  max-height: 260px;
  overflow: auto;
  border: 1px solid #e4e9f7;
  background: #f6f8ff;
  padding: 12px;
  border-radius: 12px;
  width: 100%;
}

.m-preview_frame {
  display: flex;
  justify-content: center;
}

.m-preview_frame img {
  max-width: 100%;
  display: block;
  margin: 0 auto;
  border-radius: 6px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.m-preview_empty {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #6b7a99;
}

.m-preview_icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #dbe3f9;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(41, 105, 247, 0.12);
  margin-bottom: 4px;
  color: #6d86c3;
}

.m-preview_icon svg {
  width: 36px;
  height: 36px;
}

.m-preview_title {
  font-weight: 600;
  color: #1f2a44;
}

.m-preview_desc {
  max-width: 320px;
  color: #6b7a99;
}

.m-screenshot_back {
  position: sticky;
  bottom: 0;
  background: linear-gradient(180deg, rgba(245, 248, 255, 0) 0%, #f5f8ff 60%);
  padding: 12px 0 4px;
}
</style>
