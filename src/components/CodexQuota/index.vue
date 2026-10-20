<template>
  <section class="codex-quota" @click.stop>
    <header v-if="freshness === 'stale'" class="codex-quota__header">
      <span class="tool-tag tool-tag--warning codex-quota__stale">{{ t('codexQuota.stale') }}</span>
    </header>

    <tool-state v-if="loading && !snapshot" state="loading" :message="t('codexQuota.loading')" />
    <tool-state
      v-else-if="error && !snapshot"
      state="error"
      :message="errorMessage"
      :action-label="t('experience.retry')"
      @action="refresh(true)"
    />

    <template v-if="snapshot">
      <ul class="codex-quota__windows" :aria-label="t('codexQuota.windowsLabel')">
        <li v-for="window in snapshot.windows" :key="`${window.id}-${window.durationMinutes}`">
          <div class="codex-quota__window-head">
            <strong>{{ windowLabel(window) }}</strong>
            <span>{{ formatPercent(window.remainingPercent) }}</span>
          </div>
          <div
            class="codex-quota__track"
            role="progressbar"
            :aria-label="windowLabel(window)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="Math.round(window.remainingPercent)"
          >
            <span :style="{ width: `${window.remainingPercent}%` }"></span>
          </div>
          <p>{{ t('codexQuota.resetsAt', { time: formatDate(window.resetAt) }) }}</p>
        </li>
      </ul>
      <div class="codex-quota__status-row">
        <p class="codex-quota__updated">
          {{ t('codexQuota.updatedAt', { time: formatDate(snapshot.fetchedAt) }) }}
          <span v-if="nextRefreshAt" class="codex-quota__next-refresh">
            {{ t('codexQuota.autoRefreshIn', { time: autoRefreshCountdown }) }}
          </span>
        </p>
        <button
          class="u-btn_il codex-quota__refresh"
          s-color="blue"
          type="button"
          :disabled="loading"
          @click="refresh(true)"
        >
          {{ loading ? t('codexQuota.refreshing') : t('codexQuota.refresh') }}
        </button>
      </div>
      <tool-state
        v-if="error"
        state="error"
        :message="errorMessage"
        :action-label="t('experience.retry')"
        @action="refresh(true)"
      />
    </template>

    <details class="codex-quota__actions">
      <summary>{{ t('codexQuota.moreActions') }}</summary>
      <div class="codex-quota__action-links">
        <button class="u-btn_il codex-quota__dashboard" type="button" @click="openDashboard">
          {{ t('codexQuota.openDashboard') }}
        </button>
        <button class="u-btn_il codex-quota__reset-tracker" type="button" @click="openResetTracker">
          {{ t('codexQuota.openResetTracker') }}
        </button>
        <button
          v-if="snapshot"
          class="tool-button tool-button--text codex-quota__clear"
          type="button"
          @click="clearCache"
        >
          {{ t('codexQuota.clearCache') }}
        </button>
      </div>
    </details>

    <p v-if="error === 'signed_out'" class="codex-quota__hint">
      <button class="tool-button tool-button--text" type="button" @click="openSignIn">
        {{ t('codexQuota.openSignIn') }}
      </button>
    </p>
    <details v-if="diagnostic" class="codex-quota__debug">
      <summary>{{ t('codexQuota.debug.title') }}</summary>
      <p>
        {{
          t('codexQuota.debug.summary', {
            direct: diagnostic.directResult,
            activeTabs: diagnostic.activeTabCount,
            candidates: diagnostic.candidateTabCount,
          })
        }}
      </p>
      <ul>
        <li v-for="(attempt, index) in diagnostic.attempts" :key="`${attempt.world}-${index}`">
          {{ t(`codexQuota.debug.world.${attempt.world}`) }}: {{ attempt.result }}
        </li>
      </ul>
    </details>
    <p class="codex-quota__privacy">{{ t('codexQuota.privacy') }}</p>
  </section>
</template>

<script lang="ts">
export default { name: 'CodexQuota' };
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import ToolState from '@/components/Experience/ToolState.vue';
import { langManager } from '@/utils/i18n';
import { jumpAction } from '@/utils/chrome';
import {
  clearCodexQuotaCache,
  getCodexQuotaFreshness,
  readCodexQuotaCache,
  writeCodexQuotaCache,
} from './cache';
import { requestCodexQuota } from './client';
import type {
  CodexQuotaDiagnostic,
  CodexQuotaError,
  CodexQuotaSnapshot,
  CodexQuotaWindow,
} from './types';

const DASHBOARD_URL = 'https://chatgpt.com/codex/settings/usage';
const RESET_TRACKER_URL = 'https://codex-resets.com/';
const SIGN_IN_URL = 'https://chatgpt.com/';

const snapshot = ref<CodexQuotaSnapshot | null>(null);
const error = ref<CodexQuotaError | null>(null);
const diagnostic = ref<CodexQuotaDiagnostic | null>(null);
const loading = ref(false);
const now = ref(Date.now());
const nextRefreshAt = ref<number | null>(null);
let pausedRefreshMs: number | null = null;
const currentLanguage = langManager.languageRef;
const AUTO_REFRESH_MS = 10 * 60 * 1000;
let refreshTimer: ReturnType<typeof setInterval> | undefined;
const t = (key: string, params?: Record<string, string | number>) => {
  currentLanguage.value;
  return langManager.t(key, params);
};
const freshness = computed(() => getCodexQuotaFreshness(snapshot.value, now.value));
const errorMessage = computed(() => (error.value ? t(`codexQuota.errors.${error.value}`) : ''));
const autoRefreshCountdown = computed(() => {
  if (!nextRefreshAt.value) return '';
  const totalSeconds = Math.max(0, Math.ceil((nextRefreshAt.value - now.value) / 1000));
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
});

const formatDate = (value: number) =>
  new Intl.DateTimeFormat(currentLanguage.value === 'zh' ? 'zh-CN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const formatPercent = (value: number) => t('codexQuota.remaining', { percent: Math.round(value) });

const windowLabel = (window: CodexQuotaWindow) => {
  if (window.kind === 'five-hour') return t('codexQuota.fiveHour');
  if (window.kind === 'weekly') return t('codexQuota.weekly');
  return t('codexQuota.additional', { minutes: window.durationMinutes });
};

const scheduleNextRefresh = (from = Date.now()) => {
  pausedRefreshMs = null;
  nextRefreshAt.value = from + AUTO_REFRESH_MS;
};

const clearAutoRefreshTimer = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = undefined;
};

const isDocumentHidden = () =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden';

const pauseAutoRefresh = () => {
  if (nextRefreshAt.value) {
    pausedRefreshMs = Math.max(0, nextRefreshAt.value - Date.now());
    nextRefreshAt.value = null;
  }
  clearAutoRefreshTimer();
};

const tickAutoRefresh = () => {
  now.value = Date.now();
  if (nextRefreshAt.value && now.value >= nextRefreshAt.value && !loading.value) refresh(true);
};

const resumeAutoRefresh = () => {
  if (isDocumentHidden()) return;
  if (pausedRefreshMs !== null) {
    nextRefreshAt.value = Date.now() + pausedRefreshMs;
    pausedRefreshMs = null;
  }
  if (!refreshTimer) refreshTimer = setInterval(tickAutoRefresh, 1000);
  tickAutoRefresh();
};

const handleVisibilityChange = () => {
  if (isDocumentHidden()) pauseAutoRefresh();
  else resumeAutoRefresh();
};

const refresh = async (force = false) => {
  if (loading.value) return;
  loading.value = true;
  error.value = null;
  diagnostic.value = null;
  const result = await requestCodexQuota(force);
  now.value = Date.now();
  if (result.ok) {
    snapshot.value = result.snapshot;
    await writeCodexQuotaCache(result.snapshot);
  } else {
    error.value = result.error;
    diagnostic.value = result.diagnostic || null;
  }
  loading.value = false;
  scheduleNextRefresh(now.value);
  if (isDocumentHidden()) pauseAutoRefresh();
};

const clearCache = async () => {
  await clearCodexQuotaCache();
  snapshot.value = null;
  error.value = null;
  diagnostic.value = null;
  now.value = Date.now();
};

const openDashboard = () => jumpAction(DASHBOARD_URL);
const openResetTracker = () => jumpAction(RESET_TRACKER_URL);
const openSignIn = () => jumpAction(SIGN_IN_URL);

onMounted(async () => {
  snapshot.value = await readCodexQuotaCache();
  now.value = Date.now();
  if (snapshot.value) scheduleNextRefresh(snapshot.value.fetchedAt);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  resumeAutoRefresh();
  if (getCodexQuotaFreshness(snapshot.value, now.value) !== 'fresh') await refresh();
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  clearAutoRefreshTimer();
});
</script>

<style scoped lang="less">
.codex-quota {
  min-width: 0;
  color: var(--color-text-primary);
}

.codex-quota__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  p {
    margin: 0;
    color: var(--color-text-secondary);
  }
}

.codex-quota__windows {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    padding: 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    background: var(--color-background-light);
  }
  p {
    margin: 8px 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-xs);
  }
}

.codex-quota__window-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.codex-quota__track {
  height: 8px;
  margin-top: 10px;
  overflow: hidden;
  border-radius: var(--border-radius-pill);
  background: var(--color-background-dark);
}
.codex-quota__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
  transition: width 0.2s ease;
}
.codex-quota__updated,
.codex-quota__privacy {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.codex-quota__next-refresh {
  display: block;
  margin-top: 3px;
}
.codex-quota__status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}
.codex-quota__status-row .codex-quota__updated {
  margin: 0;
}
.codex-quota__actions {
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.codex-quota__actions summary {
  width: fit-content;
  cursor: pointer;
}
.codex-quota__action-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding-top: 8px;
}
.codex-quota__hint {
  margin: 10px 0 0;
}
.codex-quota__debug {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  color: var(--color-text-secondary);
  background: var(--color-background-dark);
  font-size: var(--font-size-xs);

  p,
  ul {
    margin: 6px 0 0;
  }
  ul {
    padding-left: 18px;
  }
}
</style>
