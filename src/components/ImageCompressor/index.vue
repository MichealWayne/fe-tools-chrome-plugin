<template>
  <section class="media-tool image-compressor" tabindex="0" @paste="onPaste">
    <input
      ref="fileInput"
      class="z-hide"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      @change="onFileChange"
    />
    <button
      v-if="!originalUrl"
      type="button"
      class="image-dropzone"
      @click="fileInput?.click()"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <icon-inbox />
      <span>{{ t('dragTip') }}</span>
      <small>{{ t('formatTip') }}</small>
    </button>
    <div v-else class="image-compressor__preview" @dragover.prevent @drop.prevent="onDrop">
      <div class="converter-tool__actions">
        <button
          type="button"
          class="tool-button tool-button--small"
          :aria-pressed="previewMode === 'original'"
          @click="previewMode = 'original'"
        >
          {{ t('original') }}
        </button>
        <button
          type="button"
          class="tool-button tool-button--small"
          :aria-pressed="previewMode === 'result'"
          :disabled="!result"
          @click="previewMode = 'result'"
        >
          {{ t('result') }}
        </button>
        <button type="button" class="tool-button tool-button--small" @click="fileInput?.click()">
          {{ t('replace') }}
        </button>
      </div>
      <image-viewer
        :src="previewMode === 'result' && resultUrl ? resultUrl : originalUrl"
        :alt="t(previewMode === 'result' ? 'result' : 'original')"
        backgrounds
      />
    </div>
    <p class="image-compressor__hint">{{ t('localHint') }}</p>
    <fieldset class="image-compressor__settings" :disabled="processing">
      <legend>{{ t('settings') }}</legend>
      <label class="converter-field" for="image-output-format">
        <span>{{ t('outputFormat') }}</span>
        <select id="image-output-format" v-model="settings.format">
          <option value="image/jpeg">JPEG</option>
          <option value="image/png">PNG</option>
          <option value="image/webp">WebP</option>
        </select>
      </label>
      <label class="converter-field" for="image-quality-preset">
        <span>{{ t('preset') }}</span>
        <select
          id="image-quality-preset"
          :value="preset"
          :disabled="settings.format === 'image/png'"
          @change="setPreset"
        >
          <option value="0.92">{{ t('clearPreset') }}</option>
          <option value="0.8">{{ t('balancedPreset') }}</option>
          <option value="0.6">{{ t('smallPreset') }}</option>
          <option value="custom">{{ t('customPreset') }}</option>
        </select>
      </label>
      <label class="converter-field" for="compression-rate">
        <span>{{ t('quality') }} · {{ Math.round(settings.quality * 100) }}%</span>
        <input
          id="compression-rate"
          v-model.number="settings.quality"
          type="range"
          min="0.1"
          max="1"
          step="0.01"
          :disabled="settings.format === 'image/png'"
        />
      </label>
      <label v-if="settings.format === 'image/jpeg'" class="converter-field" for="image-background">
        <span>{{ t('background') }}</span>
        <input id="image-background" v-model="settings.background" type="color" />
      </label>
      <label class="image-compressor__toggle">
        <input v-model="settings.resize" type="checkbox" data-test="resize" />
        {{ t('resize') }}
      </label>
      <template v-if="settings.resize">
        <label class="converter-field" for="image-max-width">
          <span>{{ t('maxWidth') }}</span>
          <input
            id="image-max-width"
            v-model.number="settings.maxWidth"
            type="number"
            min="1"
            max="16384"
          />
        </label>
        <label class="converter-field" for="image-max-height">
          <span>{{ t('maxHeight') }}</span>
          <input
            id="image-max-height"
            v-model.number="settings.maxHeight"
            type="number"
            min="1"
            max="16384"
          />
        </label>
      </template>
      <label class="image-compressor__toggle">
        <input
          v-model="settings.target"
          type="checkbox"
          data-test="target"
          :disabled="settings.format === 'image/png'"
        />{{ t('target') }}
      </label>
      <template v-if="settings.target && settings.format !== 'image/png'">
        <label class="converter-field" for="image-target-kb">
          <span>{{ t('targetKB') }}</span>
          <input
            id="image-target-kb"
            v-model.number="settings.targetKB"
            type="number"
            min="1"
            step="1"
          />
        </label>
        <label class="image-compressor__toggle">
          <input v-model="settings.allowResize" type="checkbox" data-test="allow-resize" />
          {{ t('allowResize') }}
        </label>
      </template>
    </fieldset>
    <p class="image-compressor__hint">
      {{ t(settings.format === 'image/png' ? 'pngHint' : 'qualityHint') }}
    </p>
    <p v-if="settings.format === 'image/jpeg'" class="image-compressor__hint">
      {{ t('jpegHint') }}
    </p>
    <p v-if="!settings.resize" class="image-compressor__hint">{{ t('preserveHint') }}</p>
    <div class="converter-tool__actions">
      <button class="u-btn" type="button" :disabled="!file || processing" @click="run()">
        {{ t('compress') }}
      </button>
      <button
        class="u-btn"
        type="button"
        data-test="download"
        :disabled="!canExport"
        @click="download()"
      >
        {{ t(result?.keptOriginal ? 'downloadOriginal' : 'download') }}
      </button>
      <button v-if="result && savings < 0" class="u-btn" type="button" @click="download(true)">
        {{ t('downloadOriginal') }}
      </button>
      <button v-if="processing" class="u-btn" type="button" @click="cancel">
        {{ t('cancel') }}
      </button>
      <button class="u-btn" type="button" :disabled="!file && !processing" @click="clear">
        {{ langManager.t('common.clear') }}
      </button>
    </div>
    <tool-state v-if="processing" state="loading" :message="t('processing')" />
    <inline-feedback :feedback="error ? { message: error, tone: 'error' } : null" />
    <p v-if="stale" class="image-compressor__stale" role="status">{{ t('stale') }}</p>
    <template v-if="result && file">
      <p v-if="result.keptOriginal && !stale" class="image-compressor__retained" role="status">
        {{ t('originalRetained') }}
      </p>
      <p class="image-compressor__details">
        {{ file.name }} · {{ result.originalWidth }} × {{ result.originalHeight }} →
        {{ result.width }} × {{ result.height }} ·
        {{ result.blob.type.replace('image/', '').toUpperCase() }}
      </p>
      <p class="image-compressor__metrics" role="status">
        {{
          t('byteComparison', {
            original: formatMediaBytes(file.size),
            result: formatMediaBytes(result.blob.size),
          })
        }}
        ·
        {{
          savings === 0
            ? t('unchanged')
            : t(savings > 0 ? 'saved' : 'grown', { percent: Math.abs(savings).toFixed(1) })
        }}
      </p>
      <p
        v-if="settings.target && settings.format !== 'image/png' && !stale"
        class="image-compressor__target"
        role="status"
      >
        {{ t(result.targetMet ? 'targetMet' : 'targetMissed') }}
      </p>
      <details class="image-compressor__base64">
        <summary>{{ t('base64Label') }}</summary>
        <button
          class="u-btn"
          type="button"
          :disabled="!canExport || base64Loading"
          @click="generateBase64"
        >
          {{ t(base64Loading ? 'processing' : 'generateBase64') }}
        </button>
        <template v-if="base64 && canExport">
          <CopyButton :value="base64" :label="t('copyBase64')" class="u-btn" />
          <textarea :value="base64" readonly :aria-label="t('base64Label')" />
        </template>
      </details>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import CopyButton from '@/components/Experience/CopyButton.vue';
import ImageViewer from '@/components/Experience/ImageViewer.vue';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import ToolState from '@/components/Experience/ToolState.vue';
import { formatMediaBytes } from '@/utils/media-metrics';
import { langManager } from '@/utils/i18n';
import { useImageOptimizer } from './useImageOptimizer';
import IconInbox from './IconInbox.vue';

defineOptions({ name: 'ImageCompressor' });
const {
  t,
  settings,
  file,
  result,
  originalUrl,
  resultUrl,
  base64,
  base64Loading,
  processing,
  stale,
  error,
  previewMode,
  canExport,
  savings,
  run,
  handleFiles,
  onPaste,
  download,
  generateBase64,
  cancel,
  reset,
} = useImageOptimizer();
const fileInput = ref<HTMLInputElement | null>(null);
const preset = computed(() =>
  [0.92, 0.8, 0.6].includes(settings.quality) ? String(settings.quality) : 'custom'
);
const setPreset = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  if (value !== 'custom') settings.quality = Number(value);
};
const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  void handleFiles(input.files);
  input.value = '';
};
const onDrop = (event: DragEvent) => handleFiles(event.dataTransfer?.files);
const clear = () => {
  reset();
  if (fileInput.value) fileInput.value.value = '';
};
</script>

<style scoped>
.image-compressor {
  display: grid;
  gap: 8px;
}
.image-dropzone {
  display: grid;
  justify-items: center;
  gap: 6px;
  min-height: clamp(160px, calc(100dvh - 290px), 280px);
  border: 2px dashed var(--color-border);
  border-radius: 10px;
  background: var(--color-background);
  cursor: pointer;
}
.image-compressor__preview img {
  max-width: 100%;
  max-height: 100%;
  min-height: 0;
  object-fit: contain;
}
.image-compressor__preview {
  box-sizing: border-box;
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 6px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-background);
}
.image-compressor__metrics {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
}
.image-compressor__settings {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 8px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
}
.image-compressor__settings legend {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.image-compressor__toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  grid-column: 1 / -1;
  font-size: var(--font-size-xs);
}
.image-compressor__hint,
.image-compressor__details,
.image-compressor__target,
.image-compressor__retained,
.image-compressor__stale {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.image-compressor .converter-field {
  min-width: 0;
  display: grid;
  gap: 4px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.image-compressor .converter-field input,
.image-compressor .converter-field select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 36px;
  padding: 7px 9px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  background: var(--color-background);
  font: inherit;
}
.image-compressor .converter-tool__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.image-compressor__base64 {
  display: grid;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.image-compressor__base64 summary {
  cursor: pointer;
}
.image-compressor__base64 textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 64px;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
}
</style>
