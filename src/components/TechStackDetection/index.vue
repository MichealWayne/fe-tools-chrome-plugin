<template>
  <section class="m-tech-stack converter-tool" @click.stop="handleStop">
    <div class="m-tech-stack__actions converter-tool__actions">
      <button class="u-btn_il g-fs14" s-color="blue" :disabled="isAnalyzing" @click="startDetect">
        {{ isAnalyzing ? t('techStack.analyzing') : t('techStack.startDetect') }}
      </button>
    </div>

    <tool-state
      v-if="errorMessage"
      state="error"
      :message="errorMessage"
      :action-label="t('experience.retry')"
      @action="startDetect"
    />
    <tool-state v-else-if="isAnalyzing" state="loading" :message="t('techStack.analyzing')" />

    <div v-if="analyzed" class="m-tech-stack__result">
      <template v-if="hits.length">
        <p class="g-fs12 m-tech-stack__summary">
          {{ t('techStack.hitCount', { count: hits.length }) }}
        </p>
        <section v-for="group in groupedHits" :key="group.category" class="m-tech-stack__group">
          <h3 class="g-fs12 m-tech-stack__group-title">
            {{ t(`techStack.category.${group.category}`) }} ({{ group.items.length }})
          </h3>
          <ul class="m-tech-stack__list">
            <li v-for="hit in group.items" :key="hit.key" class="m-tech-stack__item">
              <div class="m-tech-stack__item-head">
                <strong>{{ hit.name }}</strong>
                <span class="m-tech-stack__tag">{{
                  t(`techStack.confidence.${hit.confidence}`)
                }}</span>
              </div>
              <ul class="m-tech-stack__evidence">
                <li v-for="reason in hit.evidence" :key="`${hit.key}-${reason}`">{{ reason }}</li>
              </ul>
            </li>
          </ul>
        </section>
      </template>

      <tool-state v-else state="empty" :message="t('techStack.empty')" />
    </div>
  </section>
</template>

<script lang="ts">
export default {
  name: 'TechStackDetection',
};
</script>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { langManager } from '@/utils/i18n';
import { detectTechStackFromSignals, type TechStackHit } from './detector';
import { runPageProbes } from './probe';
import ToolState from '@/components/Experience/ToolState.vue';

const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);

const isAnalyzing = ref(false);
const analyzed = ref(false);
const errorMessage = ref('');
const hits = ref<TechStackHit[]>([]);
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

const getActiveTab = () =>
  new Promise<chrome.tabs.Tab>((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs?.[0];
      if (!tab || !tab.id) {
        reject(new Error(t('techStack.errorUnavailable')));
        return;
      }
      resolve(tab);
    });
  });

const startDetect = async () => {
  isAnalyzing.value = true;
  analyzed.value = false;
  errorMessage.value = '';
  hits.value = [];

  try {
    const tab = await getActiveTab();
    const probe = await runPageProbes(tab.id as number);
    hits.value = detectTechStackFromSignals(probe);
    analyzed.value = true;
  } catch (error) {
    errorMessage.value = (error as Error)?.message || t('techStack.errorUnavailable');
  } finally {
    isAnalyzing.value = false;
  }
};
</script>

<style scoped>
.m-tech-stack {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.m-tech-stack__error {
  color: var(--color-error-dark);
  margin-bottom: var(--spacing-sm);
}

.m-tech-stack__summary {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text-secondary);
}

.m-tech-stack__group {
  margin-bottom: var(--spacing-sm);
}

.m-tech-stack__group-title {
  margin: 0 0 var(--spacing-xs);
  color: var(--color-text-secondary);
}

.m-tech-stack__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: 0;
  margin: 0;
  list-style: none;
}

.m-tech-stack__item {
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: 10px;
  background: var(--color-background);
}

.m-tech-stack__item-head {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-xs);
}

.m-tech-stack__tag {
  font-size: 11px;
  line-height: 1;
  color: var(--color-primary);
  background: var(--color-background-dark);
  border-radius: var(--border-radius-pill);
  padding: 4px 6px;
}

.m-tech-stack__tag--muted {
  color: var(--color-text-secondary);
  background: var(--color-background-dark);
}

.m-tech-stack__evidence {
  margin: 0;
  padding-left: 18px;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.m-tech-stack__empty {
  color: var(--color-text-secondary);
}
</style>
