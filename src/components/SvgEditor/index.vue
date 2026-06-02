<template>
  <section class="svg-editor" @click="stopPropagation">
    <div class="svg-editor__header">
      <div class="svg-editor__header-content">
        <h4 class="svg-editor__title">{{ t('svgEditor.title') }}</h4>
        <p>{{ t('svgEditor.description') }}</p>
      </div>
    </div>

    <div class="svg-editor__content">
      <div class="svg-editor__input-section">
        <div class="svg-editor__panel">
          <div class="svg-editor__panel-header">
            <span>{{ t('svgEditor.svgInput') }}</span>
            <div class="svg-editor__panel-controls">
              <span v-if="svgInput" class="svg-editor__btn-link" @click="clearInput">
                {{ t('svgEditor.clearInput') }}
              </span>
              <span class="svg-editor__btn-link" @click="loadExample">
                {{ t('svgEditor.loadExample') }}
              </span>
              <label class="svg-editor__upload-btn">
                {{ t('svgEditor.uploadSvg') }}
                <input
                  type="file"
                  accept=".svg"
                  class="svg-editor__upload-input"
                  @change="handleFileUpload"
                />
              </label>
            </div>
          </div>
          <textarea
            v-model="svgInput"
            class="svg-editor__textarea"
            :placeholder="t('svgEditor.placeholder')"
          />
          <div v-if="error" class="svg-editor__error">
            {{ error }}
          </div>
        </div>
      </div>

      <div class="svg-editor__middle-section">
        <div class="svg-editor__controls-section">
          <div class="svg-editor__controls">
            <div class="svg-editor__options">
              <div class="svg-editor__options-header" @click="toggleOptionsPanel">
                <h4>{{ t('svgEditor.optionsTitle') }}</h4>
                <span class="svg-editor__options-toggle">
                  <i
                    class="u-icon"
                    :class="optionsExpanded ? 'icon-chevron-up' : 'icon-chevron-down'"
                  ></i>
                </span>
              </div>
              <div v-show="optionsExpanded" class="svg-editor__options-panel">
                <div class="svg-editor__option-group">
                  <label class="svg-editor__checkbox">
                    <input v-model="options.removeComments" type="checkbox" />
                    <span>{{ t('svgEditor.options.removeComments') }}</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input v-model="options.removeEmptyAttrs" type="checkbox" />
                    <span>{{ t('svgEditor.options.removeEmptyAttrs') }}</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input v-model="options.removeEmptyText" type="checkbox" />
                    <span>{{ t('svgEditor.options.removeEmptyText') }}</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input v-model="options.removeHiddenElems" type="checkbox" />
                    <span>{{ t('svgEditor.options.removeHiddenElems') }}</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input v-model="options.removeMetadata" type="checkbox" />
                    <span>{{ t('svgEditor.options.removeMetadata') }}</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input v-model="options.removeUnusedNS" type="checkbox" />
                    <span>{{ t('svgEditor.options.removeUnusedNS') }}</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input v-model="options.cleanupIDs" type="checkbox" />
                    <span>{{ t('svgEditor.options.cleanupIDs') }}</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input v-model="options.convertColors" type="checkbox" />
                    <span>{{ t('svgEditor.options.convertColors') }}</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input v-model="options.removeViewBox" type="checkbox" />
                    <span>{{ t('svgEditor.options.removeViewBox') }}</span>
                  </label>
                </div>
              </div>
              <div class="svg-editor__action-buttons">
                <button
                  class="u-btn_il svg-editor__action-btn"
                  s-color="blue"
                  :disabled="!svgInput"
                  @click="optimizeSvg"
                >
                  {{ t('svgEditor.actions.optimizeSvg') }}
                </button>
                <button
                  class="u-btn_il svg-editor__action-btn"
                  :disabled="!svgInput"
                  @click="previewSvg"
                >
                  {{ t('svgEditor.actions.preview') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="svg-editor__output-section">
        <div class="svg-editor__panel">
          <div class="svg-editor__panel-header">
            <span>{{ t('svgEditor.outputTitle') }}</span>
            <div class="svg-editor__panel-controls">
              <span
                class="svg-editor__btn-link"
                :class="{ 'svg-editor__btn-link--disabled': !optimizedSvg }"
                @click="copyToClipboard"
              >
                {{ t('svgEditor.actions.copy') }}
              </span>
              <span
                class="svg-editor__btn-link"
                :class="{ 'svg-editor__btn-link--disabled': !optimizedSvg }"
                @click="downloadSvg"
              >
                {{ t('svgEditor.actions.download') }}
              </span>
            </div>
          </div>
          <textarea
            v-model="optimizedSvg"
            class="svg-editor__textarea"
            :placeholder="t('svgEditor.outputPlaceholder')"
            :disabled="!optimizedSvg"
          />
          <div v-if="stats.show" class="svg-editor__stats">
            <p>
              {{ t('svgEditor.stats.originalSize') }}: {{ stats.originalSize }} |
              {{ t('svgEditor.stats.optimizedSize') }}: {{ stats.optimizedSize }} |
              {{ t('svgEditor.stats.reduction') }}: {{ stats.reduction }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showPreview" class="svg-editor__preview">
      <div class="svg-editor__preview-header">
        <h4>{{ t('svgEditor.previewTitle') }}</h4>
        <span class="svg-editor__btn-link" @click="showPreview = false">{{
          t('svgEditor.actions.close')
        }}</span>
      </div>
      <div class="svg-editor__preview-content" v-html="sanitizedPreviewSvg"></div>
    </div>

    <div class="svg-editor__tips">
      <h4>{{ t('svgEditor.tips.title') }}</h4>
      <ul>
        <li>{{ t('svgEditor.tips.item1') }}</li>
        <li>{{ t('svgEditor.tips.item2') }}</li>
        <li>{{ t('svgEditor.tips.item3') }}</li>
        <li>{{ t('svgEditor.tips.item4') }}</li>
        <li>{{ t('svgEditor.tips.item5') }}</li>
      </ul>
    </div>

    <div v-if="successVisible" class="svg-editor__success-modal">
      <div class="svg-editor__success-modal-content">
        <p>{{ successMessage }}</p>
        <button
          class="u-btn_il svg-editor__success-btn"
          s-color="blue"
          @click="successVisible = false"
        >
          {{ t('common.ok') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, defineOptions, defineProps } from 'vue';
import { langManager } from '@/utils/i18n';
import { sanitizeSvgMarkup } from '@/utils/sanitize';
import {
  cleanupIDs,
  convertColors,
  formatBytes,
  preserveViewBox,
  removeComments,
  removeEmptyAttributes,
  removeEmptyText,
  removeHiddenElements,
  removeMetadata,
  removeUnusedNamespaces,
} from './svg-optimizer';

const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);

defineOptions({
  name: 'SvgEditor',
});

defineProps<{
  back?: () => void;
}>();

const svgInput = ref('');
const optimizedSvg = ref('');
const error = ref('');
const successVisible = ref(false);
const successMessage = ref('');
const showPreview = ref(false);
/**
 * Toggle state for the options panel accordion.
 */
const optionsExpanded = ref(true);

/**
 * Optimizer feature flags set by the user.
 */
const options = reactive({
  removeComments: true,
  removeEmptyAttrs: true,
  removeEmptyText: true,
  removeHiddenElems: true,
  removeMetadata: true,
  removeUnusedNS: true,
  cleanupIDs: true,
  convertColors: true,
  removeViewBox: false,
});

/**
 * Size statistics for the optimization run.
 */
const stats = reactive({
  show: false,
  originalSize: '0 B',
  optimizedSize: '0 B',
  reduction: '0%',
});

/**
 * Flip the expansion state of the options panel.
 */
const toggleOptionsPanel = () => {
  optionsExpanded.value = !optionsExpanded.value;
};

/**
 * Sanitized SVG preview for safe rendering.
 */
const sanitizedPreviewSvg = computed(() => {
  return sanitizeSvgMarkup(optimizedSvg.value || svgInput.value);
});

/**
 * Reset the editor input, output, and stats.
 */
const clearInput = () => {
  svgInput.value = '';
  optimizedSvg.value = '';
  error.value = '';
  stats.show = false;
};

/**
 * Load a sample SVG into the editor.
 */
const loadExample = () => {
  svgInput.value = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <!-- 这是一个注释 -->
  <circle cx="12" cy="12" r="10"></circle>
  <line x1="12" y1="8" x2="12" y2="16"></line>
  <line x1="8" y1="12" x2="16" y2="12"></line>
</svg>`;
};

/**
 * Stop propagation for nested click handlers.
 * @param e - DOM event to stop.
 */
const stopPropagation = (e: Event) => {
  e.stopPropagation();
};

/**
 * Read an uploaded SVG file into the input area.
 * @param e - File input change event.
 */
const handleFileUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      if (e.target?.result) {
        svgInput.value = e.target.result as string;
      }
    };
    reader.readAsText(file);
  }
};

/**
 * Optimize the SVG input based on selected flags.
 */
const optimizeSvg = () => {
  error.value = '';

  if (!svgInput.value) {
    error.value = t('svgEditor.messages.inputRequired');
    return;
  }

  try {
    /**
     * Parse the SVG into a DOM for transformation.
     */
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgInput.value, 'image/svg+xml');

    /**
     * Detect parser errors before applying optimizations.
     */
    const parserError = svgDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error(
        t('svgEditor.messages.parseError', { message: parserError.textContent || '' })
      );
    }

    /**
     * Apply selected optimization passes in sequence.
     */
    if (options.removeComments) {
      removeComments(svgDoc);
    }

    if (options.removeEmptyAttrs) {
      removeEmptyAttributes(svgDoc);
    }

    if (options.removeEmptyText) {
      removeEmptyText(svgDoc);
    }

    if (options.removeHiddenElems) {
      removeHiddenElements(svgDoc);
    }

    if (options.removeMetadata) {
      removeMetadata(svgDoc);
    }

    if (options.removeUnusedNS) {
      removeUnusedNamespaces(svgDoc);
    }

    if (options.cleanupIDs) {
      cleanupIDs(svgDoc);
    }

    if (options.convertColors) {
      convertColors(svgDoc);
    }

    if (!options.removeViewBox) {
      preserveViewBox(svgDoc);
    }

    /**
     * Serialize the optimized DOM back to an SVG string.
     */
    const serializer = new XMLSerializer();
    let optimized = serializer.serializeToString(svgDoc);

    /**
     * Compute size reduction statistics for display.
     */
    const originalSize = new Blob([svgInput.value]).size;
    const optimizedSize = new Blob([optimized]).size;
    const reduction = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(2);

    stats.show = true;
    stats.originalSize = formatBytes(originalSize);
    stats.optimizedSize = formatBytes(optimizedSize);
    stats.reduction = `${reduction}%`;

    optimizedSvg.value = optimized;
    showSuccess(t('svgEditor.messages.optimizeSuccess'));
  } catch (e) {
    console.error(e);
    error.value = t('svgEditor.messages.optimizeFailed', { message: (e as Error).message });
    optimizedSvg.value = '';
  }
};

/**
 * Show the preview overlay for the current SVG.
 */
const previewSvg = () => {
  if (!svgInput.value) {
    error.value = t('svgEditor.messages.inputRequired');
    return;
  }

  showPreview.value = true;
};

/**
 * Copy the optimized SVG to the clipboard.
 */
const copyToClipboard = async () => {
  if (!optimizedSvg.value) return;

  try {
    await navigator.clipboard.writeText(optimizedSvg.value);
    showSuccess(t('svgEditor.messages.copySuccess'));
  } catch (err) {
    error.value = t('svgEditor.messages.copyFailed');
  }
};

/**
 * Download the optimized SVG as a file.
 */
const downloadSvg = () => {
  if (!optimizedSvg.value) return;

  const blob = new Blob([optimizedSvg.value], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'optimized.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showSuccess(t('svgEditor.messages.downloadSuccess'));
};

/**
 * Display a temporary success toast message.
 * @param message - Success text to show.
 */
const showSuccess = (message: string) => {
  successMessage.value = message;
  successVisible.value = true;
  setTimeout(() => {
    successVisible.value = false;
  }, 2000);
};
</script>
<style lang="less" scoped src="./svg-editor.less"></style>
