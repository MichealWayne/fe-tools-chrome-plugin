<template>
  <div class="request-history">
    <div class="history-header">
      <h3>{{ t('postman.history.title') }}</h3>
      <div class="history-actions">
        <button class="clear-btn" @click="clearHistory">
          <i class="fas fa-trash"></i> {{ t('postman.actions.clear') }}
        </button>
        <button class="toggle-btn" @click="toggleHistory">
          <i :class="['fas', isExpanded ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
        </button>
      </div>
    </div>

    <div v-if="isExpanded" class="history-content">
      <div v-if="history.length === 0" class="no-history">
        <i class="fas fa-history"></i>
        <p>{{ t('postman.history.empty') }}</p>
      </div>

      <div v-else class="history-list">
        <div
          v-for="(item, index) in history"
          :key="index"
          class="history-item"
          @click="selectHistoryItem(item)"
        >
          <div class="history-method" :class="item.method.toLowerCase()">
            {{ item.method }}
          </div>
          <div class="history-url">{{ item.url }}</div>
          <div class="history-time">{{ formatTime(item.timestamp) }}</div>
          <div class="history-status" :class="getStatusClass(item.status)">
            {{ item.status }}
          </div>
          <button class="remove-btn" @click.stop="removeHistoryItem(index)">
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

const toggleHistory = () => {
  isExpanded.value = !isExpanded.value;
};

const selectHistoryItem = (item: PostmanHistoryItem) => {
  emit('select-item', item);
};

const clearHistory = () => {
  if (confirm(t('postman.history.clearConfirm'))) {
    emit('clear-history');
  }
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
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 20px;
}

.history-header {
  background: #f8f9fa;
  padding: 15px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-header h3 {
  margin: 0;
  color: #333;
}

.history-actions {
  display: flex;
  gap: 10px;
}

.clear-btn,
.toggle-btn {
  padding: 5px 10px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.clear-btn:hover,
.toggle-btn:hover {
  background: #f8f9fa;
}

.clear-btn {
  color: #dc3545;
}

.history-content {
  max-height: 300px;
  overflow-y: auto;
}

.no-history {
  padding: 40px;
  text-align: center;
  color: #6c757d;
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
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-item:hover {
  background: #f8f9fa;
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
  background: #d4edda;
  color: #155724;
}

.history-method.post {
  background: #fff3cd;
  color: #856404;
}

.history-method.put {
  background: #cce5ff;
  color: #004085;
}

.history-method.delete {
  background: #f8d7da;
  color: #721c24;
}

.history-method.patch {
  background: #e2e3e5;
  color: #383d41;
}

.history-url {
  flex: 1;
  font-size: 14px;
  color: #495057;
  margin-right: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 12px;
  color: #6c757d;
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
  background: #d4edda;
  color: #155724;
}

.history-status.redirect {
  background: #fff3cd;
  color: #856404;
}

.history-status.client-error {
  background: #f8d7da;
  color: #721c24;
}

.history-status.server-error {
  background: #f5c6cb;
  color: #721c24;
}

.remove-btn {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #f8f9fa;
  color: #dc3545;
}
</style>
