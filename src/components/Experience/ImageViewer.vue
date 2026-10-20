<template>
  <section class="image-viewer">
    <div class="image-viewer__toolbar" :aria-label="t('mediaView.controls')">
      <button
        type="button"
        class="tool-button tool-button--small"
        :aria-pressed="zoom === null"
        @click="zoom = null"
      >
        {{ t('mediaView.fit') }}
      </button>
      <button
        type="button"
        class="tool-button tool-button--small"
        :aria-pressed="zoom === 1"
        @click="zoom = 1"
      >
        100%
      </button>
      <button
        type="button"
        class="tool-button tool-button--small"
        :aria-label="t('mediaView.zoomOut')"
        :disabled="zoom !== null && zoom <= minimumZoom"
        @click="changeZoom(-0.25)"
      >
        −
      </button>
      <span class="image-viewer__scale">{{
        zoom === null ? t('mediaView.fit') : `${Math.round(zoom * 100)}%`
      }}</span>
      <button
        type="button"
        class="tool-button tool-button--small"
        :aria-label="t('mediaView.zoomIn')"
        :disabled="zoom !== null && zoom >= 4"
        @click="changeZoom(0.25)"
      >
        +
      </button>
      <select
        v-if="backgrounds"
        v-model="background"
        class="tool-input"
        :aria-label="t('mediaView.background')"
      >
        <option value="checker">{{ t('mediaView.checker') }}</option>
        <option value="light">{{ t('mediaView.light') }}</option>
        <option value="dark">{{ t('mediaView.dark') }}</option>
      </select>
    </div>
    <div
      ref="viewport"
      class="image-viewer__viewport"
      :class="[`image-viewer__viewport--${background}`, { 'is-panning': dragging }]"
      tabindex="0"
      :aria-label="t('mediaView.panHint')"
      @pointerdown="startPan"
      @pointermove="movePan"
      @pointerup="stopPan"
      @pointercancel="stopPan"
      @lostpointercapture="stopPan"
    >
      <img ref="image" :src="src" :alt="alt" :style="imageStyle" draggable="false" @load="onLoad" />
    </div>
    <p class="image-viewer__hint">{{ t('mediaView.panHint') }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { langManager } from '@/utils/i18n';
const props = withDefaults(defineProps<{ src: string; alt: string; backgrounds?: boolean }>(), {
  backgrounds: false,
});
const t = (key: string) => langManager.t(key);
const viewport = ref<HTMLElement | null>(null);
const image = ref<HTMLImageElement | null>(null);
const zoom = ref<number | null>(null);
const naturalWidth = ref(0);
const fittedZoom = ref(1);
const minimumZoom = computed(() => Math.min(0.25, fittedZoom.value / 4));
const background = ref('checker');
const dragging = ref(false);
let pan: { x: number; y: number; left: number; top: number } | undefined;
const imageStyle = computed(() =>
  zoom.value === null
    ? { maxWidth: '100%', width: 'auto' }
    : {
        width: naturalWidth.value ? `${naturalWidth.value * zoom.value}px` : undefined,
        maxWidth: 'none',
      }
);
const onLoad = (event: Event) => {
  naturalWidth.value = (event.target as HTMLImageElement).naturalWidth;
};
const changeZoom = (delta: number) => {
  if (zoom.value === null) {
    const width = image.value?.getBoundingClientRect().width;
    fittedZoom.value = width && naturalWidth.value ? width / naturalWidth.value : 1;
  }
  // Large images can already fit below 25%; allow them to shrink further.
  const current = zoom.value ?? fittedZoom.value;
  zoom.value = Math.min(4, Math.max(minimumZoom.value, current * (1 + delta)));
};
const startPan = (event: PointerEvent) => {
  if (event.button !== 0 || event.pointerType === 'touch' || !viewport.value) return;
  pan = {
    x: event.clientX,
    y: event.clientY,
    left: viewport.value.scrollLeft,
    top: viewport.value.scrollTop,
  };
  dragging.value = true;
  viewport.value.setPointerCapture?.(event.pointerId);
};
const movePan = (event: PointerEvent) => {
  if (!pan || !viewport.value) return;
  viewport.value.scrollLeft = pan.left - (event.clientX - pan.x);
  viewport.value.scrollTop = pan.top - (event.clientY - pan.y);
};
const stopPan = () => {
  dragging.value = false;
  pan = undefined;
};
watch(
  () => props.src,
  () => {
    zoom.value = null;
    naturalWidth.value = 0;
    fittedZoom.value = 1;
    stopPan();
  }
);
</script>

<style scoped>
.image-viewer {
  display: grid;
  gap: 8px;
  min-width: 0;
  width: 100%;
}
.image-viewer__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.image-viewer__toolbar select {
  min-height: var(--control-height-small);
  padding: 4px 8px;
  font-size: var(--font-size-xs);
}
.image-viewer__scale {
  min-width: 40px;
  text-align: center;
  font-size: var(--font-size-xs);
  font-variant-numeric: tabular-nums;
}
.image-viewer__viewport {
  max-height: 65dvh;
  min-height: 100px;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  cursor: grab;
  touch-action: pan-x pan-y;
}
.image-viewer__viewport.is-panning {
  cursor: grabbing;
  touch-action: none;
}
.image-viewer__viewport--checker {
  background-color: #fff;
  background-image: conic-gradient(#e5e7eb 25%, transparent 0 50%, #e5e7eb 0 75%, transparent 0);
  background-size: 16px 16px;
}
.image-viewer__viewport--light {
  background: #fff;
}
.image-viewer__viewport--dark {
  background: #262626;
}
.image-viewer__viewport img {
  display: block;
  height: auto;
  margin: 0 auto;
  user-select: none;
}
.image-viewer__hint {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 11px;
}
</style>
