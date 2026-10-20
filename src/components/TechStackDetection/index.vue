<template>
  <section class="m-tech-stack converter-tool" :aria-busy="isAnalyzing" @click.stop="handleStop">
    <header class="m-tech-stack__toolbar">
      <div class="m-tech-stack__report-title">
        <span class="m-tech-stack__report-icon" aria-hidden="true">&lt;/&gt;</span>
        <div>
          <h3>{{ t('techStack.reportTitle') }}</h3>
          <p>{{ t('techStack.localAnalysis') }}</p>
        </div>
      </div>
      <div class="m-tech-stack__actions converter-tool__actions">
        <button
          type="button"
          class="tool-button tool-button--primary"
          :disabled="isAnalyzing"
          @click="startDetect"
        >
          <svg
            v-if="!isAnalyzing"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <path d="M20 7v5h-5M4 17v-5h5" />
            <path d="M6 7a7 7 0 0 1 12-1l2 2M4 16l2 2a7 7 0 0 0 12-1" />
          </svg>
          {{
            isAnalyzing
              ? t('techStack.analyzing')
              : t(analyzed ? 'techStack.detectAgain' : 'techStack.startDetect')
          }}
        </button>
        <template v-if="analyzed">
          <copy-button :value="summaryText" :label="t('techStack.copySummary')" />
          <copy-button :value="jsonText" :label="t('techStack.copyJson')" />
        </template>
      </div>
    </header>

    <div v-if="!analyzed" class="m-tech-stack__state-surface">
      <tool-state
        v-if="errorMessage"
        state="error"
        :message="errorMessage"
        :action-label="t('experience.retry')"
        @action="startDetect"
      />
      <tool-state v-else-if="isAnalyzing" state="loading" :message="t('techStack.analyzing')" />
      <div v-else class="m-tech-stack__intro">
        <svg
          width="42"
          height="42"
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <rect x="6" y="9" width="36" height="30" rx="5" />
          <path d="M6 17h36M11 13h2m3 0h2M19 24l-5 4 5 4m10-8 5 4-5 4m-5-10-3 13" />
        </svg>
        <h4>{{ t('techStack.readyTitle') }}</h4>
        <p>{{ t('techStack.readyDescription') }}</p>
        <span class="m-tech-stack__scope-label">{{ t('techStack.localAnalysis') }}</span>
      </div>
    </div>

    <div v-if="analyzed" class="m-tech-stack__result">
      <section class="m-tech-stack__overview" :aria-label="t('techStack.scanOverview')">
        <div class="m-tech-stack__overview-heading">
          <span class="m-tech-stack__eyebrow">{{ t('techStack.scanOverview') }}</span>
          <span
            class="tool-tag"
            :class="partialCollection ? 'tool-tag--warning' : 'tool-tag--primary'"
            >{{ t(partialCollection ? 'techStack.partialLabel' : 'techStack.scanFinished') }}</span
          >
        </div>
        <p v-if="targetUrl" class="m-tech-stack__target" :title="targetUrl">{{ targetUrl }}</p>
        <p class="m-tech-stack__timestamp">
          {{ t('techStack.scannedAt', { time: formattedScanTime }) }}
        </p>
        <dl class="m-tech-stack__metrics">
          <div>
            <dt>{{ t('techStack.technologiesFound') }}</dt>
            <dd>
              {{ hits.length }}
            </dd>
          </div>
          <div>
            <dt>{{ t('techStack.withVersion') }}</dt>
            <dd>
              {{ versionedHitCount }}<span>/ {{ hits.length }}</span>
            </dd>
          </div>
          <div>
            <dt>{{ t('techStack.highConfidence') }}</dt>
            <dd>
              {{ highConfidenceCount }}
            </dd>
          </div>
        </dl>
        <details class="m-tech-stack__scan-details">
          <summary>{{ t('techStack.scopeAndStatus') }}</summary>
          <p>{{ t('techStack.mainFrameOnly') }}</p>
          <p>
            {{
              t('techStack.collectionStatus', {
                dom: t(`techStack.probeStatus.${coverage?.isolated || 'unknown'}`),
                runtime: t(`techStack.probeStatus.${coverage?.main || 'unknown'}`),
              })
            }}
          </p>
        </details>
      </section>
      <p v-if="partialCollection" class="m-tech-stack__warning" role="status">
        <span class="m-tech-stack__warning-icon" aria-hidden="true">!</span>
        {{ t('techStack.partialCollection') }}
      </p>
      <template v-if="hits.length">
        <section
          v-for="group in groupedHits"
          :key="group.category"
          class="m-tech-stack__group"
          :aria-label="t(`techStack.category.${group.category}`)"
        >
          <div class="m-tech-stack__group-heading">
            <h3>
              {{ t(`techStack.category.${group.category}`) }}<span>{{ group.items.length }}</span>
            </h3>
            <span class="m-tech-stack__group-line" aria-hidden="true"></span>
          </div>
          <ul class="m-tech-stack__list">
            <tech-stack-card v-for="hit in group.items" :key="hit.key" :hit="hit" />
          </ul>
        </section>
      </template>
      <div v-else class="m-tech-stack__state-surface">
        <tool-state state="empty" :message="t('techStack.empty')" />
      </div>
      <p class="m-tech-stack__footnote">{{ t('techStack.description') }}</p>
    </div>
  </section>
</template>

<script lang="ts">
export default {
  name: 'TechStackDetection',
};
</script>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { langManager } from '@/utils/i18n';
import { detectTechStackFromSignals, type TechStackHit } from './detector';
import { runPageProbes } from './probe';
import ToolState from '@/components/Experience/ToolState.vue';
import CopyButton from '@/components/Experience/CopyButton.vue';
import type { ProbeCoverage } from './types';
import { createTechStackReport, formatTechStackSummary } from './report';
import { redactUrl } from './versions';
import TechStackCard from './TechStackCard.vue';

const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);

const props = withDefaults(defineProps<{ sourceTabId?: number; autoStart?: boolean }>(), {
  autoStart: false,
  sourceTabId: undefined,
});
const emit = defineEmits<{ targetChange: [url: string] }>();

const isAnalyzing = ref(false);
const analyzed = ref(false);
const errorMessage = ref('');
const hits = ref<TechStackHit[]>([]);
const targetUrl = ref('');
const scannedAt = ref('');
const coverage = ref<ProbeCoverage>();
const partialCollection = computed(
  () => coverage.value?.isolated === 'failed' || coverage.value?.main === 'failed'
);
const report = computed(() =>
  createTechStackReport({
    target: targetUrl.value,
    scannedAt: scannedAt.value,
    scope: 'main-frame',
    coverage: coverage.value,
    hits: hits.value,
  })
);
const summaryText = computed(() => formatTechStackSummary(report.value));
const jsonText = computed(() => JSON.stringify(report.value, null, 2));
const versionedHitCount = computed(() => hits.value.filter(hit => hit.versions?.length).length);
const highConfidenceCount = computed(
  () => hits.value.filter(hit => hit.confidence === 'high').length
);
const formattedScanTime = computed(() =>
  scannedAt.value
    ? new Date(scannedAt.value).toLocaleString(
        langManager.languageRef.value === 'zh' ? 'zh-CN' : 'en-US',
        { hour12: false }
      )
    : ''
);
const groupedHits = computed(() =>
  ['framework', 'bundler', 'library']
    .map(category => ({
      category,
      items: hits.value.filter(item => item.category === category),
    }))
    .filter(group => group.items.length > 0)
);

const handleStop = (e: Event) => {
  e.stopPropagation();
};

const getActiveTab = () => {
  if (props.sourceTabId !== undefined) {
    return chrome.tabs.get(props.sourceTabId).then(tab => {
      if (!tab?.id || !/^https?:\/\//.test(tab.url || '')) {
        throw new Error(t('techStack.errorUnavailable'));
      }
      return tab;
    });
  }
  return new Promise<chrome.tabs.Tab>((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs?.[0];
      if (!tab || !tab.id) {
        reject(new Error(t('techStack.errorUnavailable')));
        return;
      }
      resolve(tab);
    });
  });
};

const startDetect = async () => {
  if (isAnalyzing.value) return;
  isAnalyzing.value = true;
  analyzed.value = false;
  errorMessage.value = '';
  hits.value = [];
  coverage.value = undefined;

  try {
    const tab = await getActiveTab();
    emit('targetChange', tab.url || '');
    targetUrl.value = tab.url ? redactUrl(tab.url) : '';
    const probe = await runPageProbes(tab.id as number);
    hits.value = detectTechStackFromSignals(probe);
    coverage.value = probe.coverage;
    scannedAt.value = new Date().toISOString();
    analyzed.value = true;
  } catch {
    errorMessage.value = t('techStack.errorUnavailable');
  } finally {
    isAnalyzing.value = false;
  }
};
onMounted(() => {
  if (props.autoStart) void startDetect();
});
</script>

<style scoped lang="less" src="./tech-stack-detection.less"></style>
