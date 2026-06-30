<template>
  <section class="reference-tool m-linux">
    <label class="reference-tool__search">
      <span class="reference-tool__label">{{ t('linuxCommand.searchLabel') }}</span>
      <input
        v-model="filterTxt"
        class="u-input"
        type="search"
        :placeholder="t('linuxCommand.inputPlaceholder')"
      />
    </label>
    <div class="m-quick_commands" :aria-label="t('linuxCommand.commonCommands')">
      <button
        v-for="quickCmd in quickCommands"
        :key="quickCmd"
        type="button"
        class="u-btn_quick"
        @click="filterTxt = quickCmd"
      >
        {{ quickCmd }}
      </button>
    </div>
    <tool-state v-if="loading" state="loading" :message="t('experience.loading')" />
    <tool-state
      v-else-if="loadError"
      state="error"
      :message="loadError"
      :action-label="t('experience.retry')"
      @action="loadCommands"
    />
    <tool-state
      v-else-if="filterTxt && !visibleCommands.length"
      state="empty"
      :message="t('linuxCommand.noResults')"
    />
    <p v-else class="reference-tool__count">
      {{ t('experience.resultCount', { count: visibleCommands.length }) }}
    </p>

    <ul class="reference-tool__list">
      <li v-for="item in visibleCommands" :key="item.name" class="m-command_item">
        <div class="reference-tool__item-header">
          <span
            ><strong>{{ item.name }}</strong> {{ item.description }}</span
          >
          <span class="reference-tool__actions">
            <button type="button" @click="copyCommand(item.syntax)">{{ t('common.copy') }}</button>
            <button
              type="button"
              :aria-expanded="item.isOpened"
              @click="item.isOpened = !item.isOpened"
            >
              {{ item.isOpened ? t('common.collapse') : t('linuxCommand.viewDetails') }}
            </button>
          </span>
        </div>
        <figure>
          <pre :class="$style.pre">{{ item.syntax }}</pre>
        </figure>
        <div v-if="item.isOpened" class="command-details">
          <section v-if="item.examples?.length">
            <h3>{{ t('linuxCommand.examples') }}</h3>
            <div v-for="example in item.examples" :key="example.command">
              <pre :class="$style.example">$ {{ example.command }}</pre>
              <p>{{ example.description }}</p>
            </div>
          </section>
          <section v-if="item.options?.length">
            <h3>{{ t('linuxCommand.commonOptions') }}</h3>
            <ul>
              <li v-for="option in item.options" :key="option.flag">
                <code>{{ option.flag }}</code> {{ option.description }}
              </li>
            </ul>
          </section>
        </div>
      </li>
    </ul>
    <inline-feedback :feedback="feedback" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ajax from '@/api';
import { langManager } from '@/utils/i18n';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import ToolState from '@/components/Experience/ToolState.vue';
import type { LinuxCommand } from '@/types/api';
import type { InlineFeedbackMessage } from '@/types/experience';

defineOptions({ name: 'LinuxCommand' });

type CommandItem = LinuxCommand & { isOpened: boolean };
const props = withDefaults(defineProps<{ keywords?: string }>(), { keywords: '' });
const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);
const filterTxt = ref(props.keywords);
const commandList = ref<CommandItem[]>([]);
const loading = ref(false);
const loadError = ref('');
const feedback = ref<InlineFeedbackMessage | null>(null);
const quickCommands = [
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
  'ps',
  'curl',
  'ssh',
];

const visibleCommands = computed(() => {
  const keyword = filterTxt.value.trim().toLowerCase();
  if (!keyword) return commandList.value;
  return commandList.value.filter(item =>
    `${item.name} ${item.description} ${item.syntax}`.toLowerCase().includes(keyword)
  );
});

const loadCommands = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    const response = await ajax.getLinuxCommands();
    const list = response.list || response.data;
    commandList.value = Array.isArray(list)
      ? list.map(item => ({ ...(item as LinuxCommand), isOpened: false }))
      : [];
  } catch (error) {
    loadError.value = (error as Error).message || t('linuxCommand.loadFailed');
  } finally {
    loading.value = false;
  }
};

const copyCommand = async (syntax: string) => {
  try {
    await navigator.clipboard.writeText(syntax);
    feedback.value = { message: t('experience.copied'), tone: 'success' };
  } catch (error) {
    feedback.value = { message: (error as Error).message, tone: 'error' };
  }
};

onMounted(loadCommands);
</script>

<style module>
.pre,
.example {
  padding: 10px;
  overflow: auto;
  background: #f6f8ff;
  border-radius: 8px;
}
.example {
  color: #fff;
  background: #1f2a44;
}
</style>

<style scoped>
.m-linux {
  max-height: 500px;
  overflow: auto;
}
.m-quick_commands {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 10px 0;
}
.u-btn_quick {
  padding: 4px 8px;
  border: 1px solid #dbe3f9;
  border-radius: 999px;
  background: #fff;
}
.m-command_item {
  padding: 12px;
  border: 1px solid #e4e9f7;
  border-radius: 10px;
}
.command-details h3 {
  font-size: 13px;
}
</style>
