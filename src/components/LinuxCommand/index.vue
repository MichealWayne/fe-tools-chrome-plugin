<template>
  <section class="m-linux" @click.stop="handleStop">
    <p class="m-filter_ctn u-c-middle">
      <input
        v-model="filterTxt"
        class="u-input"
        type="text"
        :placeholder="t('linuxCommand.inputPlaceholder')"
        @input="handleFilter"
      />
    </p>

    <!-- 常用命令快捷按钮 -->
    <div class="m-quick_commands g-mt20">
      <button
        v-for="quickCmd in quickCommands"
        :key="quickCmd"
        class="u-btn_quick g-mr10 g-mb10"
        @click="handleQuickSearch(quickCmd)"
      >
        {{ quickCmd }}
      </button>
    </div>

    <ul class="g-mt30">
      <li
        v-for="(item, index) in commandList"
        :key="index"
        :class="{
          'z-fold': !item.isOpened,
          'z-hide': !isCommandVisible(item),
        }"
        class="m-command_item g-center g-mb20"
      >
        <p class="g-fs14">
          <strong class="command-name">{{ item.name }}</strong>
          <span v-if="item.description" class="g-fs12">（{{ item.description }}）</span>
          <a class="u-link g-fs12 g-ml5" s-cr_blue @click="handleCommandToggle(index)">
            {{ item.isOpened ? t('common.collapse') : t('linuxCommand.viewDetails') }}
          </a>
        </p>

        <figure>
          <pre :class="$style.pre">{{ item.syntax }}</pre>
        </figure>

        <!-- 详细信息区域 -->
        <div class="j-fold command-details">
          <!-- 示例 -->
          <div v-if="item.examples && item.examples.length > 0" class="command-examples g-mt15">
            <p class="g-fs14 g-mb10">
              <strong style="color: #27ae60">{{ t('linuxCommand.examples') }}:</strong>
            </p>
            <div
              v-for="(example, exIndex) in item.examples"
              :key="exIndex"
              class="example-item g-mb10"
            >
              <figure>
                <pre :class="$style.example">$ {{ example.command }}</pre>
              </figure>
              <p class="g-fs12 g-mt5" style="color: #666; margin: 0">
                {{ example.description }}
              </p>
            </div>
          </div>

          <!-- 常用选项 -->
          <div v-if="item.options && item.options.length > 0" class="command-options g-mt15">
            <p class="g-fs14 g-mb10">
              <strong style="color: #8e44ad">{{ t('linuxCommand.commonOptions') }}:</strong>
            </p>
            <ul class="options-list">
              <li v-for="(option, optIndex) in item.options" :key="optIndex" class="g-fs13 g-mb5">
                <code class="option-flag">{{ option.flag }}</code>
                <span class="option-desc">{{ option.description }}</span>
              </li>
            </ul>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
export default {
  name: 'LinuxCommand',
};
</script>

<script lang="ts" setup>
import { defineProps, ref, toRefs, onMounted } from 'vue';
import { langManager } from '@/utils/i18n';
import ajax from '@/api';

const t = (key: string) => langManager.t(key);

const handleStop = (e: Event) => {
  e.stopPropagation();
};

const props = defineProps({
  keywords: {
    type: String,
    default: '',
  },
  back: {
    type: Function,
    default: undefined,
  },
});

const { keywords } = toRefs(props);

const filterTxt = ref('');
const commandList = ref<any[]>([]);
const isLoading = ref(false);

/**
 * Commonly used command shortcuts for quick filtering.
 */
const quickCommands = ref([
  'ls',
  'cd',
  'pwd',
  'mkdir',
  'rm',
  'cp',
  'mv',
  'find',
  'grep',
  'chmod',
  'chown',
  'ps',
  'kill',
  'top',
  'df',
  'du',
  'tar',
  'wget',
  'curl',
  'ssh',
]);

/**
 * Fetch and normalize the Linux command list.
 */
const getLinuxCommands = async () => {
  try {
    isLoading.value = true;
    const response = await ajax.getLinuxCommands();

    const list = response?.list || response?.data;
    if (Array.isArray(list)) {
      commandList.value = list.map(item => ({
        ...item,
        isOpened: false,
      }));
    }
  } catch (error) {
    console.error('Failed to load Linux commands:', error);
  } finally {
    isLoading.value = false;
  }
};

/**
 * Placeholder hook for filtering (handled via computed).
 */
const handleFilter = () => {
  /**
   * Filtering is handled in computed logic.
   */
};

/**
 * Apply a quick-search keyword.
 * @param command - Command keyword to filter by.
 */
const handleQuickSearch = (command: string) => {
  filterTxt.value = command;
};

/**
 * Toggle the visibility of command details.
 * @param index - Index of the command in the list.
 */
const handleCommandToggle = (index: number) => {
  const item = commandList.value[index];
  if (!item) return;
  item.isOpened = !item.isOpened;
};

/**
 * Determine whether a command matches the current filter.
 * @param item - Command record.
 */
const isCommandVisible = (item: any) => {
  if (!filterTxt.value.trim()) return true;

  const keyword = filterTxt.value.toLowerCase().trim();
  const name = (item.name || '').toLowerCase();
  const description = (item.description || '').toLowerCase();
  const syntax = (item.syntax || '').toLowerCase();
  return name.includes(keyword) || description.includes(keyword) || syntax.includes(keyword);
};

onMounted(() => {
  getLinuxCommands();

  if (keywords.value) {
    filterTxt.value = keywords.value;
  }
});
</script>

<style module>
.pre {
  background: #f6f8ff;
  border: 1px solid #e2e9ff;
  border-radius: 8px;
  padding: 12px;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
  color: #2b3a55;
  overflow-x: auto;
}

.example {
  background: #1f2a44;
  color: #ecf0f1;
  border-radius: 8px;
  padding: 10px 12px;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
  overflow-x: auto;
}
</style>

<style scoped>
.m-linux {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 22px 26px 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f8ff 100%);
  border: 1px solid #e2e9ff;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(30, 74, 173, 0.12);
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
}

.m-filter_ctn {
  margin-bottom: 18px;
}

.u-input {
  width: 100%;
  max-width: 400px;
  padding: 10px 14px;
  border: 1px solid #dbe3f9;
  border-radius: 10px;
  font-size: 14px;
  color: #2b3a55;
  background: #fff;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.u-input:focus {
  outline: none;
  border-color: #2969f7;
  box-shadow: 0 0 0 3px rgba(41, 105, 247, 0.18);
}

.m-quick_commands {
  text-align: center;
  padding: 16px 0;
  border-bottom: 1px solid #e2e9ff;
}

.u-btn_quick {
  background: #fff;
  border: 1px solid #dbe3f9;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  color: #2b3a55;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(28, 63, 124, 0.08);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.u-btn_quick:hover {
  background: linear-gradient(135deg, #2969f7 0%, #4d7fff 100%);
  color: #fff;
  border-color: #2c66f7;
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(41, 105, 247, 0.2);
}

.m-command_item {
  background: #fff;
  border: 1px solid #e4e9f7;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 18px rgba(28, 63, 124, 0.08);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.m-command_item:hover {
  box-shadow: 0 12px 22px rgba(28, 63, 124, 0.12);
  transform: translateY(-1px);
}

.command-name {
  color: #1f2a44;
  font-size: 16px;
  font-weight: 600;
}

.u-link {
  color: #2969f7;
  text-decoration: none;
  cursor: pointer;
}

.u-link:hover {
  text-decoration: underline;
}

.j-fold {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.m-command_item:not(.z-fold) .j-fold {
  max-height: 1000px;
}

.z-hide {
  display: none;
}

.command-examples {
  border-left: 3px solid #2fb36b;
  padding-left: 15px;
}

.example-item {
  margin-bottom: 15px;
}

.command-options {
  border-left: 3px solid #5d6bff;
  padding-left: 15px;
}

.options-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.options-list li {
  padding: 5px 0;
  border-bottom: 1px solid #f0f4ff;
}

.option-flag {
  background: #f6f8ff;
  color: #2b3a55;
  border: 1px solid #dbe3f9;
  padding: 2px 6px;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  margin-right: 8px;
}

.option-desc {
  color: #4a5a78;
}

.m-linux_back {
  color: #2969f7;
  cursor: pointer;
  padding: 12px 0 4px;
  border-radius: 8px;
  position: sticky;
  bottom: 0;
  background: linear-gradient(180deg, rgba(245, 248, 255, 0) 0%, #f5f8ff 60%);
  transition: color 0.2s ease;
}

.m-linux_back:hover {
  color: #1f55d1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .m-linux {
    padding: 15px;
  }

  .m-command_item {
    padding: 15px;
  }

  .u-btn_quick {
    margin: 2px;
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>
