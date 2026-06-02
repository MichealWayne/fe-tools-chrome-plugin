<template>
  <section class="m-tech-stack" @click.stop="handleStop">
    <header class="m-tech-stack__header">
      <h2 class="g-fs18">{{ t('techStack.title') }}</h2>
      <p class="g-fs12 m-tech-stack__desc">{{ t('techStack.description') }}</p>
    </header>

    <div class="m-tech-stack__actions">
      <button class="u-btn_il g-fs14" s-color="blue" :disabled="isAnalyzing" @click="startDetect">
        {{ isAnalyzing ? t('techStack.analyzing') : t('techStack.startDetect') }}
      </button>
    </div>

    <p v-if="errorMessage" class="m-tech-stack__error g-fs12">{{ errorMessage }}</p>

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

      <p v-else class="g-fs12 m-tech-stack__empty">{{ t('techStack.empty') }}</p>
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
import { detectTechStackFromSignals, type ProbeSignals, type TechStackHit } from './detector';

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

const runPageProbe = (tabId: number) =>
  new Promise<ProbeSignals>((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => {
          const scripts = Array.from(document.scripts)
            .map(item => item.src || '')
            .filter(Boolean);
          const links = Array.from(document.querySelectorAll('link[href]'))
            .map(item => item.getAttribute('href') || '')
            .filter(Boolean);
          const scriptTypes = Array.from(document.querySelectorAll('script[type]'))
            .map(item => item.getAttribute('type') || '')
            .filter(Boolean);
          const inlineScriptText = Array.from(document.querySelectorAll('script:not([src])'))
            .map(item => item.textContent || '')
            .join('\n')
            .slice(0, 120000)
            .toLowerCase();
          const htmlSnippet = document.documentElement.innerHTML.slice(0, 120000).toLowerCase();
          const contentPool = `${inlineScriptText}\n${htmlSnippet}`;

          const contentPatterns = [
            '__next_data__',
            '__next_f',
            'next-route-announcer',
            '__nuxt__',
            'nuxtapp',
            'createapp(',
            'new vue(',
            'reactdom.hydrate',
            'reactdom.createroot',
            'createroot(',
            'angular.module(',
            'platformbrowserdynamic',
            'routermodule.forroot',
            'import.meta.hot',
            '__webpack_require__',
            'webpackjsonp',
            'webpackchunk',
            'axios.create(',
            'axios.defaults',
            'configurestore(',
            'createstore(',
            'redux devtools',
            'createrouter(',
            'createwebhistory(',
            'browserrouter',
            'hashrouter',
            'provideRouter(',
            'createpinia(',
            'definestore(',
            'makeautoobservable(',
            'observable(',
            'sveltekit',
            '$$props',
            '$$slots',
            'solidjs',
            'createsignal(',
            'creatememo(',
            'ember.application',
            'ember-data',
            'backbone.model',
            'backbone.view',
            'jquery.fn.jquery',
            'astro-island',
            'data-astro-',
            'window.__remixcontext',
            'remix:manifest',
            '___gatsby',
            'gatsby-script',
            '__preactattr_',
            'x-data',
            'data-controller',
            'queryclientprovider',
            'usequery(',
            'inmemorycache(',
            'apolloclient(',
            'apollo-provider',
            'behaviorsubject(',
            'subject(',
          ];
          const content = contentPatterns.filter(pattern => contentPool.includes(pattern));

          const metaTags = Array.from(document.querySelectorAll('meta')).map(meta => {
            const name = meta.getAttribute('name') || '';
            const property = meta.getAttribute('property') || '';
            const content = meta.getAttribute('content') || '';
            return `${name}|${property}|${content}`;
          });

          const htmlAttrPool = new Set<string>();
          Array.from(document.documentElement.attributes).forEach(attr => {
            htmlAttrPool.add(`${attr.name}=${attr.value}`);
            htmlAttrPool.add(attr.name);
          });

          const selectors: string[] = [];
          if (document.querySelector('[data-reactroot],[data-reactid]')) {
            selectors.push('react_dom_marker');
          }
          if (document.querySelector('#root,[id*=\"react-root\"]')) {
            selectors.push('react_root');
          }
          if (document.querySelector('[ng-version]')) {
            selectors.push('ng_version_marker');
          }
          if (document.querySelector('[data-v-app]')) {
            selectors.push('vue_app_marker');
          }
          const sampleNodes = Array.from(document.querySelectorAll('*')).slice(0, 400);
          if (
            sampleNodes.some(node =>
              Array.from(node.attributes || []).some(attr => attr.name.startsWith('data-v-'))
            )
          ) {
            selectors.push('vue_sfc_marker');
          }
          if (document.querySelector('[data-svelte-h],[sveltekit\\:prefetch]')) {
            selectors.push('svelte_dom_marker');
          }
          if (document.getElementById('__NEXT_DATA__')) {
            selectors.push('__next_data_script');
          }
          if (document.getElementById('__next')) {
            selectors.push('next_root');
          }
          if (document.getElementById('__NUXT__') || document.getElementById('__NUXT_DATA__')) {
            selectors.push('__nuxt_data_script');
          }
          if (document.getElementById('__nuxt')) {
            selectors.push('nuxt_root');
          }
          if (document.querySelector('[data-n-head]')) {
            selectors.push('nuxt_head_marker');
          }
          sampleNodes.forEach(node => {
            Array.from(node.attributes || []).forEach(attr => {
              htmlAttrPool.add(attr.name);
              if (attr.value) {
                htmlAttrPool.add(`${attr.name}=${attr.value}`);
              }
            });
          });
          const htmlAttrs = Array.from(htmlAttrPool);

          const globalCandidates = [
            'Vue',
            '__VUE_DEVTOOLS_GLOBAL_HOOK__',
            'React',
            '__REACT_DEVTOOLS_GLOBAL_HOOK__',
            'angular',
            'ng',
            'Zone',
            'jQuery',
            '$',
            '__NEXT_DATA__',
            '__NUXT__',
            '__webpack_require__',
            '__webpack_chunk_load__',
            'webpackJsonp',
            '__vite_plugin_react_preamble_installed__',
            'axios',
            'Redux',
            '__REDUX_DEVTOOLS_EXTENSION__',
            '__REDUX_DEVTOOLS_EXTENSION_COMPOSE__',
            'VueRouter',
            'Vuex',
            'Pinia',
            'mobx',
            'rxjs',
            'preact',
            'SolidJS',
            'Alpine',
            'Stimulus',
            'Ember',
            'Backbone',
            '___gatsby',
            '__remixContext',
            '__APOLLO_CLIENT__',
            '__REACT_QUERY_STATE__',
          ];

          const globals = globalCandidates.filter(key => key in window);
          const windowRef = window as unknown as Record<string, any>;
          const versions: Record<string, string> = {};

          const setVersion = (key: string, value: unknown) => {
            if (!value) {
              return;
            }
            const normalized = String(value).trim();
            if (normalized) {
              versions[key] = normalized;
            }
          };

          setVersion('vue', windowRef.Vue?.version);
          setVersion('react', windowRef.React?.version);
          setVersion('angular', windowRef.angular?.version?.full || windowRef.ng?.version?.full);
          setVersion('jquery', windowRef.jQuery?.fn?.jquery);
          setVersion('axios', windowRef.axios?.VERSION);

          return {
            scripts,
            links,
            scriptTypes,
            globals,
            selectors,
            metas: metaTags,
            htmlAttrs,
            content,
            versions,
          };
        },
      },
      results => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        const result = results?.[0]?.result as ProbeSignals | undefined;
        if (!result) {
          reject(new Error('No probe result'));
          return;
        }
        resolve(result);
      }
    );
  });

const startDetect = async () => {
  isAnalyzing.value = true;
  analyzed.value = false;
  errorMessage.value = '';
  hits.value = [];

  try {
    const tab = await getActiveTab();
    const probe = await runPageProbe(tab.id as number);
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
  width: 480px;
  max-height: 420px;
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-sizing: border-box;
}

.m-tech-stack__header {
  margin-bottom: 10px;
}

.m-tech-stack__desc {
  color: #6b778c;
  margin-top: 4px;
}

.m-tech-stack__actions {
  margin-bottom: 10px;
}

.m-tech-stack__error {
  color: #d93025;
  margin-bottom: 8px;
}

.m-tech-stack__summary {
  margin-bottom: 8px;
  color: #4d5a70;
}

.m-tech-stack__group {
  margin-bottom: 10px;
}

.m-tech-stack__group-title {
  margin: 0 0 6px;
  color: #5c6f8a;
}

.m-tech-stack__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.m-tech-stack__item {
  border: 1px solid #d8e2ff;
  border-radius: 8px;
  padding: 10px;
  background: #f8fbff;
}

.m-tech-stack__item-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.m-tech-stack__tag {
  font-size: 11px;
  line-height: 1;
  color: #1e63ff;
  background: #eaf1ff;
  border-radius: 999px;
  padding: 4px 6px;
}

.m-tech-stack__tag--muted {
  color: #5c6f8a;
  background: #edf2fa;
}

.m-tech-stack__evidence {
  margin: 0;
  padding-left: 18px;
  color: #5c6f8a;
  font-size: 12px;
  line-height: 1.5;
}

.m-tech-stack__empty {
  color: #6b778c;
}
</style>
