<template>
  <section class="svg-editor" @click="stopPropagation">
    <div class="svg-editor__header">
      <div class="svg-editor__header-content">
        <h4 class="svg-editor__title">{{ t('svgEditor.title') }}</h4>
        <p>{{ t('svgEditor.description') }}</p>
      </div>
      <button class="svg-editor__home-btn" @click="handleBack">
        <i class="u-icon icon-home"></i>
        {{ t('common.backHome') }}
      </button>
    </div>

    <div class="svg-editor__content">
      <div class="svg-editor__input-section">
        <div class="svg-editor__panel">
          <div class="svg-editor__panel-header">
            <span>{{ t('svgEditor.svgInput') }}</span>
            <div class="svg-editor__panel-controls">
              <span v-if="svgInput" class="svg-editor__btn-link" @click="clearInput">
                {{ t('svgEditor.clear') }}
              </span>
              <span class="svg-editor__btn-link" @click="loadExample">
                {{ t('svgEditor.loadExample') }}
              </span>
              <label class="svg-editor__upload-btn">
                {{ t('svgEditor.uploadSvg') }}
                <input
                  type="file"
                  accept=".svg"
                  @change="handleFileUpload"
                  class="svg-editor__upload-input"
                />
              </label>
            </div>
          </div>
          <textarea
            v-model="svgInput"
            class="svg-editor__textarea"
            :placeholder="t('svgEditor.placeholder')"
          />
          <div class="svg-editor__error" v-if="error">
            {{ error }}
          </div>
        </div>
      </div>

      <div class="svg-editor__middle-section">
        <div class="svg-editor__controls-section">
          <div class="svg-editor__controls">
            <div class="svg-editor__options">
              <div class="svg-editor__options-header" @click="toggleOptionsPanel">
                <h4>优化选项</h4>
                <span class="svg-editor__options-toggle">
                  <i
                    class="u-icon"
                    :class="optionsExpanded ? 'icon-chevron-up' : 'icon-chevron-down'"
                  ></i>
                </span>
              </div>
              <div class="svg-editor__options-panel" v-show="optionsExpanded">
                <div class="svg-editor__option-group">
                  <label class="svg-editor__checkbox">
                    <input type="checkbox" v-model="options.removeComments" />
                    <span>移除注释</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input type="checkbox" v-model="options.removeEmptyAttrs" />
                    <span>移除空属性</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input type="checkbox" v-model="options.removeEmptyText" />
                    <span>移除空文本</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input type="checkbox" v-model="options.removeHiddenElems" />
                    <span>移除隐藏元素</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input type="checkbox" v-model="options.removeMetadata" />
                    <span>移除元数据</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input type="checkbox" v-model="options.removeUnusedNS" />
                    <span>移除未使用的命名空间</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input type="checkbox" v-model="options.cleanupIDs" />
                    <span>清理 ID</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input type="checkbox" v-model="options.convertColors" />
                    <span>优化颜色值</span>
                  </label>
                  <label class="svg-editor__checkbox">
                    <input type="checkbox" v-model="options.removeViewBox" />
                    <span>保留 viewBox</span>
                  </label>
                </div>
              </div>
              <div class="svg-editor__action-buttons">
                <button
                  class="u-btn_il svg-editor__action-btn"
                  s-color="blue"
                  @click="optimizeSvg"
                  :disabled="!svgInput"
                >
                  优化 SVG
                </button>
                <button
                  class="u-btn_il svg-editor__action-btn"
                  @click="previewSvg"
                  :disabled="!svgInput"
                >
                  预览
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="svg-editor__output-section">
        <div class="svg-editor__panel">
          <div class="svg-editor__panel-header">
            <span>优化后的 SVG</span>
            <div class="svg-editor__panel-controls">
              <span
                class="svg-editor__btn-link"
                @click="copyToClipboard"
                :class="{ 'svg-editor__btn-link--disabled': !optimizedSvg }"
              >
                复制
              </span>
              <span
                class="svg-editor__btn-link"
                @click="downloadSvg"
                :class="{ 'svg-editor__btn-link--disabled': !optimizedSvg }"
              >
                下载
              </span>
            </div>
          </div>
          <textarea
            v-model="optimizedSvg"
            class="svg-editor__textarea"
            placeholder="优化后的 SVG 将显示在这里"
            :disabled="!optimizedSvg"
          />
          <div class="svg-editor__stats" v-if="stats.show">
            <p>
              原始大小: {{ stats.originalSize }} | 优化后: {{ stats.optimizedSize }} | 减少:
              {{ stats.reduction }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="svg-editor__preview" v-if="showPreview">
      <div class="svg-editor__preview-header">
        <h4>SVG 预览</h4>
        <span class="svg-editor__btn-link" @click="showPreview = false">关闭</span>
      </div>
      <div class="svg-editor__preview-content" v-html="sanitizedPreviewSvg"></div>
    </div>

    <div class="svg-editor__tips">
      <h4>使用提示：</h4>
      <ul>
        <li>直接输入 SVG 代码或上传 SVG 文件</li>
        <li>选择需要的优化选项</li>
        <li>点击"优化 SVG"按钮生成优化后的代码</li>
        <li>使用"预览"按钮查看 SVG 效果</li>
        <li>优化后可以复制代码或下载 SVG 文件</li>
      </ul>
    </div>

    <div class="svg-editor__success-modal" v-if="successVisible">
      <div class="svg-editor__success-modal-content">
        <p>{{ successMessage }}</p>
        <button
          class="u-btn_il svg-editor__success-btn"
          s-color="blue"
          @click="successVisible = false"
        >
          确定
        </button>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, defineOptions, defineProps } from 'vue';
import { langManager } from '@/utils/i18n';

const t = (key: string) => langManager.t(key);
import DOMPurify from 'dompurify';

defineOptions({
  name: 'SvgEditor',
});

// 接收返回主页的方法
const props = defineProps<{
  back?: () => void;
}>();

const svgInput = ref('');
const optimizedSvg = ref('');
const error = ref('');
const successVisible = ref(false);
const successMessage = ref('');
const showPreview = ref(false);
// 控制选项面板的展开/收起状态，默认展开
const optionsExpanded = ref(true);

// 优化选项
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

// 统计信息
const stats = reactive({
  show: false,
  originalSize: '0 B',
  optimizedSize: '0 B',
  reduction: '0%',
});

// 切换选项面板的展开/收起状态
const toggleOptionsPanel = () => {
  optionsExpanded.value = !optionsExpanded.value;
};

// 安全的预览 SVG
const sanitizedPreviewSvg = computed(() => {
  return DOMPurify.sanitize(optimizedSvg.value || svgInput.value, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
});

// 清空输入
const clearInput = () => {
  svgInput.value = '';
  optimizedSvg.value = '';
  error.value = '';
  stats.show = false;
};

// 加载示例
const loadExample = () => {
  svgInput.value = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <!-- 这是一个注释 -->
  <circle cx="12" cy="12" r="10"></circle>
  <line x1="12" y1="8" x2="12" y2="16"></line>
  <line x1="8" y1="12" x2="16" y2="12"></line>
</svg>`;
};

// 阻止事件冒泡
const stopPropagation = (e: Event) => {
  e.stopPropagation();
};

// 处理文件上传
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

// 优化 SVG
const optimizeSvg = () => {
  error.value = '';

  if (!svgInput.value) {
    error.value = '请输入 SVG 代码';
    return;
  }

  try {
    // 创建一个解析器和一个新的 DOM
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgInput.value, 'image/svg+xml');

    // 检查解析错误
    const parserError = svgDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('SVG 解析错误: ' + parserError.textContent);
    }

    // 应用优化
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

    // 序列化回 SVG 字符串
    const serializer = new XMLSerializer();
    let optimized = serializer.serializeToString(svgDoc);

    // 计算统计信息
    const originalSize = new Blob([svgInput.value]).size;
    const optimizedSize = new Blob([optimized]).size;
    const reduction = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(2);

    stats.show = true;
    stats.originalSize = formatBytes(originalSize);
    stats.optimizedSize = formatBytes(optimizedSize);
    stats.reduction = `${reduction}%`;

    optimizedSvg.value = optimized;
    showSuccess('SVG 优化成功！');
  } catch (e) {
    console.error(e);
    error.value = `优化失败：${(e as Error).message}`;
    optimizedSvg.value = '';
  }
};

// 预览 SVG
const previewSvg = () => {
  if (!svgInput.value) {
    error.value = '请输入 SVG 代码';
    return;
  }

  showPreview.value = true;
};

// 复制到剪贴板
const copyToClipboard = async () => {
  if (!optimizedSvg.value) return;

  try {
    await navigator.clipboard.writeText(optimizedSvg.value);
    showSuccess('已复制到剪贴板！');
  } catch (err) {
    error.value = '复制失败，请手动复制';
  }
};

// 下载 SVG
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

  showSuccess('SVG 文件已下载！');
};

// 显示成功消息
const showSuccess = (message: string) => {
  successMessage.value = message;
  successVisible.value = true;
  setTimeout(() => {
    successVisible.value = false;
  }, 2000);
};

// 返回主页
const handleBack = () => {
  if (props.back) {
    props.back();
  }
};

// 工具函数：移除注释
const removeComments = (doc: Document) => {
  const nodeIterator = doc.createNodeIterator(doc, NodeFilter.SHOW_COMMENT, null);

  let node;
  const commentsToRemove = [];

  while ((node = nodeIterator.nextNode())) {
    commentsToRemove.push(node);
  }

  commentsToRemove.forEach(comment => {
    comment.parentNode?.removeChild(comment);
  });
};

// 工具函数：移除空属性
const removeEmptyAttributes = (doc: Document) => {
  const elements = doc.querySelectorAll('*');
  elements.forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.value === '') {
        el.removeAttribute(attr.name);
      }
    });
  });
};

// 工具函数：移除空文本节点
const removeEmptyText = (doc: Document) => {
  const nodeIterator = doc.createNodeIterator(doc, NodeFilter.SHOW_TEXT, null);

  let node;
  const textsToRemove = [];

  while ((node = nodeIterator.nextNode())) {
    if (node.textContent?.trim() === '') {
      textsToRemove.push(node);
    }
  }

  textsToRemove.forEach(text => {
    text.parentNode?.removeChild(text);
  });
};

// 工具函数：移除隐藏元素
const removeHiddenElements = (doc: Document) => {
  const elements = doc.querySelectorAll('[display="none"], [visibility="hidden"]');
  elements.forEach(el => {
    el.parentNode?.removeChild(el);
  });
};

// 工具函数：移除元数据
const removeMetadata = (doc: Document) => {
  const metadata = doc.querySelectorAll('metadata, title, desc');
  metadata.forEach(el => {
    el.parentNode?.removeChild(el);
  });
};

// 工具函数：移除未使用的命名空间
const removeUnusedNamespaces = (doc: Document) => {
  const svgElement = doc.querySelector('svg');
  if (!svgElement) return;

  // 这里简化处理，实际上需要更复杂的逻辑来检测未使用的命名空间
  const attributes = Array.from(svgElement.attributes);
  attributes.forEach(attr => {
    if (
      attr.name.startsWith('xmlns:') &&
      !doc.querySelector(`*[*|*="${attr.name.split(':')[1]}"]`)
    ) {
      svgElement.removeAttribute(attr.name);
    }
  });
};

// 工具函数：清理 ID
const cleanupIDs = (doc: Document) => {
  // 简化处理，实际上需要更复杂的逻辑来确保 ID 引用的完整性
  const elementsWithId = doc.querySelectorAll('[id]');
  let counter = 1;

  elementsWithId.forEach(el => {
    const oldId = el.getAttribute('id');
    const newId = `id${counter++}`;

    // 更新元素 ID
    el.setAttribute('id', newId);

    // 更新引用
    if (oldId) {
      const references = doc.querySelectorAll(`[*|href="#${oldId}"], [*|url="#${oldId}"]`);
      references.forEach(ref => {
        const attrs = Array.from(ref.attributes);
        attrs.forEach(attr => {
          if (attr.value === `#${oldId}`) {
            ref.setAttribute(attr.name, `#${newId}`);
          }
        });
      });
    }
  });
};

// 工具函数：优化颜色值
const convertColors = (doc: Document) => {
  const elementsWithColor = doc.querySelectorAll('[fill], [stroke]');

  elementsWithColor.forEach(el => {
    ['fill', 'stroke'].forEach(attr => {
      const color = el.getAttribute(attr);
      if (color) {
        // 转换 rgb 到 hex
        if (color.startsWith('rgb(')) {
          const rgb = color.match(/\d+/g);
          if (rgb && rgb.length === 3) {
            const hex = `#${parseInt(rgb[0]).toString(16).padStart(2, '0')}${parseInt(rgb[1])
              .toString(16)
              .padStart(2, '0')}${parseInt(rgb[2]).toString(16).padStart(2, '0')}`;
            el.setAttribute(attr, hex);
          }
        }

        // 简化 hex 颜色
        if (color.match(/^#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3$/i)) {
          const simplified = `#${color[1]}${color[3]}${color[5]}`;
          el.setAttribute(attr, simplified);
        }
      }
    });
  });
};

// 工具函数：保留 viewBox
const preserveViewBox = (doc: Document) => {
  const svgElement = doc.querySelector('svg');
  if (!svgElement) return;

  // 确保 viewBox 存在
  if (
    !svgElement.hasAttribute('viewBox') &&
    svgElement.hasAttribute('width') &&
    svgElement.hasAttribute('height')
  ) {
    const width = svgElement.getAttribute('width');
    const height = svgElement.getAttribute('height');
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }
};

// 工具函数：格式化字节大小
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
</script>

<style lang="less" scoped>
.svg-editor {
  padding: 10px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
  max-width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  height: calc(100vh - 40px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scrollbar-width: thin;
  scrollbar-color: #bbb #f5f5f5;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #bbb;
    border-radius: 4px;
    border: 2px solid #f5f5f5;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #999;
  }

  &__header {
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px solid #eaeaea;

    &-content {
      flex: 1;
    }

    h4.svg-editor__title {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: #1a1a1a;
    }

    p {
      color: #666;
      margin: 0;
      font-size: 12px;
      line-height: 1.4;
    }
  }

  &__home-btn {
    flex-shrink: 0;
    font-size: 13px;
    padding: 4px 8px;
    background-color: #f0f7ff;
    color: #1890ff;
    border: 1px solid #d6e8ff;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s ease;

    &:hover {
      background-color: #e6f4ff;
      color: #0c7ad9;
    }

    i {
      font-size: 12px;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-right: 5px;
  }

  &__middle-section {
    display: flex;
    gap: 10px;
  }

  &__panel {
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    height: 100%;
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    &-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #e8e8e8;
      background-color: #fafafa;
      border-radius: 4px 4px 0 0;

      span {
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }
    }

    &-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  &__options-panel {
    border-top: none;
    background-color: #fafafa;
    border-bottom: 1px solid #e8e8e8;
    padding: 10px 0;
    transition: all 0.3s ease;
  }

  &__option-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 0 12px;
  }

  &__checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #555;
    padding: 4px 0;
    transition: all 0.2s ease;

    &:hover {
      color: #333;
    }

    input {
      margin: 0;
      cursor: pointer;
    }

    span {
      white-space: nowrap;
    }
  }

  &__textarea {
    flex: 1;
    resize: none;
    border: none;
    padding: 12px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
    font-size: 13px;
    line-height: 1.5;
    color: #333;
    min-height: 300px;
    transition: background-color 0.2s ease;

    &:focus {
      outline: none;
      background-color: #fafafa;
    }
  }

  &__error {
    color: #f5222d;
    padding: 8px 12px;
    font-size: 14px;
    background-color: #fff1f0;
    border-top: 1px solid #ffccc7;
  }

  &__action-buttons {
    padding: 12px;
    border-top: 1px solid #e8e8e8;
    background-color: #fafafa;
    display: flex;
    gap: 8px;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  &__action-btn {
    transition: all 0.2s ease;
    flex: 1;
    font-size: 13px;
    padding: 6px 12px;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__btn-link {
    color: #2969f7;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      text-decoration: underline;
      color: #1a4fc4;
    }

    &--disabled {
      color: #ccc;
      cursor: not-allowed;

      &:hover {
        text-decoration: none;
        color: #ccc;
      }
    }
  }

  &__upload-btn {
    color: #2969f7;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      text-decoration: underline;
      color: #1a4fc4;
    }
  }

  &__upload-input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  &__stats {
    padding: 8px 12px;
    background-color: #f6ffed;
    border-top: 1px solid #b7eb8f;
    font-size: 12px;
    color: #52c41a;

    p {
      margin: 0;
    }
  }

  &__preview {
    margin-top: 10px;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    &-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #e8e8e8;
      background-color: #fafafa;
      border-radius: 4px 4px 0 0;

      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }
    }

    &-content {
      padding: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 150px;
      max-height: 250px;
      background-color: #f9f9f9;
      overflow: auto;
      border-radius: 0 0 4px 4px;

      svg {
        max-width: 100%;
        max-height: 200px;
        transition: transform 0.2s ease;

        &:hover {
          transform: scale(1.05);
        }
      }
    }
  }

  &__tips {
    margin-top: 10px;
    padding: 12px;
    background-color: #f0f9ff;
    border: 1px solid #bae7ff;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    position: relative;

    h4 {
      margin: 0 0 8px;
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        margin-bottom: 4px;
        font-size: 12px;
        color: #555;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  &__success-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;

    &-content {
      padding: 16px;
      border-radius: 4px;
      background-color: #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-width: 300px;
      width: 100%;
      text-align: center;
      animation: slideIn 0.3s ease;
    }

    p {
      margin: 0 0 12px;
      font-size: 14px;
      color: #333;
    }

    &__success-btn {
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 991px) {
    &__content {
      grid-template-columns: 1fr;
    }

    &__option-group {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 767px) {
    &__panel-controls {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    &__option-group {
      grid-template-columns: repeat(2, 1fr);
    }

    &__action-buttons {
      flex-direction: column;
    }

    &__textarea {
      min-height: 250px;
    }
  }

  @media (max-width: 480px) {
    &__option-group {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    &__textarea {
      min-height: 180px;
    }

    &__btn-link,
    &__upload-btn {
      font-size: 13px;
      padding: 2px 0;
    }
  }
}
</style>
