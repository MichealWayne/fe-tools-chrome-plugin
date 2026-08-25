<template>
  <div class="request-history">
    <div class="history-header">
      <h3>{{ t('postman.history.title') }}</h3>
      <div class="history-actions">
        <button class="clear-btn" @click="clearHistory">
          <i class="fas fa-trash"></i> {{ t('postman.actions.clear') }}
        </button>
        <button
          class="toggle-btn"
          :aria-label="isExpanded ? t('common.collapse') : t('linuxCommand.viewDetails')"
          @click="toggleHistory"
        >
          <span class="z-hide">{{
            isExpanded ? t('common.collapse') : t('linuxCommand.viewDetails')
          }}</span>
          <i :class="['fas', isExpanded ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
        </button>
      </div>
    </div>
    <div v-if="confirmingClear" class="postman-confirm" role="alertdialog">
      <span>{{ t('postman.history.clearConfirm') }}</span>
      <button type="button" @click="confirmClearHistory">{{ t('experience.confirm') }}</button>
      <button type="button" @click="confirmingClear = false">{{ t('experience.cancel') }}</button>
    </div>

    <div v-if="isExpanded" class="history-content">
      <div v-if="history.length === 0" class="no-history">
        <i class="fas fa-history"></i>
        <p>{{ t('postman.history.empty') }}</p>
      </div>

      <div v-else class="history-list">
        <div v-for="(item, index) in history" :key="index" class="history-item">
          <button type="button" class="history-select" @click="selectHistoryItem(item)">
            <span class="history-method" :class="item.method.toLowerCase()">{{ item.method }}</span>
            <span class="history-url">{{ item.url }}</span>
            <span class="history-time">{{ formatTime(item.timestamp) }}</span>
            <span class="history-status" :class="getStatusClass(item.status)">{{
              item.status
            }}</span>
          </button>
          <button
            class="remove-btn"
            type="button"
            :aria-label="t('postman.actions.remove')"
            @click="removeHistoryItem(index)"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'RequestHistory',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { langManager } from '@/utils/i18n';
import type { PostmanHistoryItem } from './types';

const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);

defineProps<{
  history: PostmanHistoryItem[];
}>();

const emit = defineEmits<{
  'select-item': [item: PostmanHistoryItem];
  'clear-history': [];
  'remove-item': [index: number];
}>();

const isExpanded = ref(true);
const confirmingClear = ref(false);

const toggleHistory = () => {
  isExpanded.value = !isExpanded.value;
};

const selectHistoryItem = (item: PostmanHistoryItem) => {
  emit('select-item', item);
};

const clearHistory = () => {
  confirmingClear.value = true;
};

const confirmClearHistory = () => {
  emit('clear-history');
  confirmingClear.value = false;
};

const removeHistoryItem = (index: number) => {
  emit('remove-item', index);
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    /**
     * Within the last minute.
     */
    return t('postman.history.justNow');
  } else if (diff < 3600000) {
    /**
     * Within the last hour.
     */
    return t('postman.history.minutesAgo', { minutes: Math.floor(diff / 60000) });
  } else if (diff < 86400000) {
    /**
     * Within the last day.
     */
    return t('postman.history.hoursAgo', { hours: Math.floor(diff / 3600000) });
  } else {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
};

const getStatusClass = (status?: number) => {
  if (!status) return '';
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 400 && status < 500) return 'client-error';
  if (status >= 500) return 'server-error';
  return '';
};
</script>

<style scoped>
.request-history {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-lg);
}

.history-header {
  background: var(--color-background);
  padding: 15px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-header h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.history-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.clear-btn,
.toggle-btn {
  padding: 5px 10px;
  border: 1px solid var(--color-border);
  background: var(--color-background-light);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 12px;
}

.clear-btn:hover,
.toggle-btn:hover {
  background: var(--color-background);
}

.clear-btn {
  color: var(--color-error);
}

.history-content {
  max-height: 300px;
  overflow-y: auto;
}

.history-select {
  display: contents;
  color: inherit;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.no-history {
  padding: 40px;
  text-align: center;
  color: var(--color-text-secondary);
}

.no-history i {
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: background-color var(--transition-normal);
}

.history-item:hover {
  background: var(--color-background);
}

.history-item:last-child {
  border-bottom: none;
}

.history-method {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
  margin-right: 15px;
}

.history-method.get {
  background: var(--color-success-surface);
  color: var(--color-success-foreground);
}

.history-method.post {
  background: var(--color-warning-surface);
  color: var(--color-warning-foreground);
}

.history-method.put {
  background: var(--color-info-surface);
  color: var(--color-info-foreground);
}

.history-method.delete {
  background: var(--color-error-surface);
  color: var(--color-error-foreground);
}

.history-method.patch {
  background: var(--color-neutral-surface);
  color: var(--color-neutral-foreground);
}

.history-url {
  flex: 1;
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-right: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-right: 15px;
  min-width: 80px;
}

.history-status {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  min-width: 40px;
  text-align: center;
  margin-right: 10px;
}

.history-status.success {
  background: var(--color-success-surface);
  color: var(--color-success-foreground);
}

.history-status.redirect {
  background: var(--color-warning-surface);
  color: var(--color-warning-foreground);
}

.history-status.client-error {
  background: var(--color-error-surface);
  color: var(--color-error-foreground);
}

.history-status.server-error {
  background: var(--color-error-surface-strong);
  color: var(--color-error-foreground);
}

.remove-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--border-radius-sm);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: var(--color-background);
  color: var(--color-error);
}
</style>
