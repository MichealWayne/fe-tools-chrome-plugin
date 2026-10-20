<template>
  <li class="tech-card" :class="`tech-card--${hit.category}`">
    <div class="tech-card__heading">
      <span class="tech-card__mark" aria-hidden="true">{{ hit.name.slice(0, 2) }}</span>
      <div class="tech-card__identity">
        <h4>{{ hit.name }}</h4>
        <span class="tech-card__category">{{ t(`techStack.category.${hit.category}`) }}</span>
      </div>
      <span class="tool-tag tech-card__confidence" :class="confidenceClass(hit.confidence)">
        <span class="tech-card__dot" aria-hidden="true"></span>
        {{ t(`techStack.confidence.${hit.confidence}`) }}
      </span>
    </div>

    <div v-if="!hit.versions?.length" class="tech-card__unknown">
      <span>{{ t('techStack.versionLabel') }}</span>
      <span>{{ t('techStack.versionUnknown') }}</span>
    </div>
    <ul v-else class="tech-card__versions" :aria-label="t('techStack.versionLabel')">
      <li
        v-for="version in hit.versions"
        :key="`${version.version}-${version.source}-${version.detail}`"
      >
        <code class="tech-card__version">{{ version.version }}</code>
        <div class="tech-card__version-info">
          <div class="tech-card__source">
            <span>{{ t(`techStack.versionSource.${version.source}`) }}</span>
            <span class="tech-card__version-confidence" :title="t('techStack.versionConfidence')">{{
              t(`techStack.confidence.${version.confidence}`)
            }}</span>
          </div>
          <code class="tech-card__detail">{{ version.detail }}</code>
        </div>
      </li>
    </ul>

    <p v-if="hit.versionConflict" class="tech-card__conflict">
      <span aria-hidden="true">!</span>{{ t('techStack.multipleVersions') }}
    </p>
    <details v-if="hit.evidence.length" class="m-tech-stack__evidence-details tech-card__evidence">
      <summary>{{ t('techStack.evidenceCount', { count: hit.evidence.length }) }}</summary>
      <ul>
        <li v-for="reason in hit.evidence" :key="`${hit.key}-${reason}`">
          <code>{{ reason }}</code>
        </li>
      </ul>
    </details>
  </li>
</template>

<script setup lang="ts">
import { langManager } from '@/utils/i18n';
import type { ConfidenceLevel, TechStackHit } from './types';

defineProps<{ hit: TechStackHit }>();
const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);
const confidenceClass = (confidence: ConfidenceLevel) => ({
  'tool-tag--success': confidence === 'high',
  'tool-tag--primary': confidence === 'medium',
  'tool-tag--warning': confidence === 'low',
});
</script>

<style scoped>
.tech-card {
  --tech-accent: var(--color-primary-dark);
  --tech-surface: var(--color-primary-surface);
  min-width: 0;
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-xl);
  background: var(--color-background-light);
  list-style: none;
}
.tech-card--bundler {
  --tech-accent: var(--color-warning-foreground);
  --tech-surface: var(--color-warning-surface);
}
.tech-card--library {
  --tech-accent: var(--color-success-foreground);
  --tech-surface: var(--color-success-surface);
}
.tech-card__heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: var(--spacing-md);
}
.tech-card__mark {
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  height: 34px;
  border-radius: var(--border-radius-lg);
  color: var(--tech-accent);
  background: var(--tech-surface);
  font: 600 13px var(--font-family-mono);
}
.tech-card__identity {
  flex: 1;
  min-width: 0;
}
.tech-card__identity h4 {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  overflow-wrap: anywhere;
}
.tech-card__category {
  color: var(--color-text-secondary);
  font-size: 11px;
}
.tech-card__confidence {
  flex-shrink: 0;
  font-size: 11px;
  border-radius: var(--border-radius-pill);
}
.tech-card__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
.tech-card__versions {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tech-card__versions > li {
  display: grid;
  grid-template-columns: minmax(64px, auto) minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  padding: 10px;
  border-radius: var(--border-radius-md);
  background: var(--color-background);
}
.tech-card__version {
  max-width: 120px;
  color: var(--color-text-primary);
  font: 600 13px/1.5 var(--font-family-mono);
  overflow-wrap: anywhere;
}
.tech-card__version-info {
  min-width: 0;
}
.tech-card__source {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 8px;
  color: var(--color-text-secondary);
  font-size: 11px;
  line-height: 1.6;
}
.tech-card__version-confidence {
  color: var(--color-text-secondary);
}
.tech-card__detail {
  display: block;
  margin-top: 3px;
  color: var(--color-text-secondary);
  font: 11px/1.6 var(--font-family-mono);
  overflow-wrap: anywhere;
}
.tech-card__unknown {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  padding: 10px;
  border: 1px dashed var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.tech-card__conflict {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 10px 0 0;
  padding: 8px 10px;
  border-radius: var(--border-radius-md);
  color: var(--color-warning-foreground);
  background: var(--color-warning-surface);
  font-size: 11px;
  line-height: 1.6;
}
.tech-card__conflict > span {
  font-weight: var(--font-weight-bold);
}
.tech-card__evidence {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.tech-card__evidence summary {
  width: fit-content;
  max-width: 100%;
  cursor: pointer;
}
.tech-card__evidence summary:hover {
  color: var(--color-primary-dark);
}
.tech-card__evidence ul {
  display: grid;
  gap: 6px;
  margin: 10px 0 0;
  padding-left: var(--spacing-md);
}
.tech-card__evidence code {
  font: 11px/1.6 var(--font-family-mono);
  overflow-wrap: anywhere;
}
</style>
