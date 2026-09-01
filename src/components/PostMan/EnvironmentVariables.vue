<template>
  <div class="environment-variables">
    <div class="env-header">
      <h3>{{ t('postman.environments.title') }}</h3>
      <div class="env-actions">
        <select v-model="currentEnv" class="env-select" @change="switchEnvironment">
          <option value="">{{ t('postman.environments.selectEnv') }}</option>
          <option v-for="env in environments" :key="env.name" :value="env.name">
            {{ env.name }}
          </option>
        </select>
        <button class="add-env-btn" @click="showAddEnvModal = true">
          <i class="fas fa-plus"></i> {{ t('postman.environments.addEnv') }}
        </button>
        <button
          class="toggle-btn"
          :aria-label="isExpanded ? t('common.collapse') : t('linuxCommand.viewDetails')"
          @click="toggleVariables"
        >
          <i :class="['fas', isExpanded ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
        </button>
      </div>
    </div>

    <div v-if="isExpanded" class="env-content">
      <div v-if="!currentEnv" class="no-env-selected">
        <i class="fas fa-cog"></i>
        <p>{{ t('postman.environments.noEnvSelected') }}</p>
      </div>

      <div v-else class="variables-section">
        <div class="section-header">
          <h4>{{ t('postman.environments.envTitle', { env: currentEnv }) }}</h4>
          <button class="add-var-btn" @click="addVariable">
            <i class="fas fa-plus"></i> {{ t('postman.environments.addVariable') }}
          </button>
        </div>

        <div class="variables-list">
          <KeyValueEditor
            :model-value="currentVariables"
            :key-placeholder="t('postman.environments.variableName')"
            :value-placeholder="t('postman.environments.variableValue')"
            allow-secret
            @update:model-value="updateCurrentVariables"
          />
        </div>

        <div class="env-actions-bottom">
          <button class="export-btn" @click="exportEnvironment">
            <i class="fas fa-download"></i> {{ t('postman.environments.export') }}
          </button>
          <button class="import-btn" @click="showImportModal = true">
            <i class="fas fa-upload"></i> {{ t('postman.environments.import') }}
          </button>
          <button class="delete-env-btn" @click="deleteEnvironment">
            <i class="fas fa-trash"></i> {{ t('postman.environments.deleteEnv') }}
          </button>
        </div>
        <div v-if="pendingDelete" class="postman-confirm" role="alertdialog">
          <span>{{ t('postman.environments.deleteConfirm', { env: currentEnv }) }}</span>
          <button type="button" @click="confirmDeleteEnvironment">
            {{ t('experience.confirm') }}
          </button>
          <button type="button" @click="pendingDelete = false">{{ t('experience.cancel') }}</button>
        </div>
      </div>
    </div>

    <!-- 新建环境模态框 -->
    <div v-if="showAddEnvModal" class="modal-overlay" @click="showAddEnvModal = false">
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-label="t('postman.environments.newEnvTitle')"
        @click.stop
      >
        <div class="modal-header">
          <h3>{{ t('postman.environments.newEnvTitle') }}</h3>
          <button
            class="close-btn"
            :aria-label="t('postman.environments.cancel')"
            @click="showAddEnvModal = false"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <input
            v-model="newEnvName"
            :placeholder="t('postman.environments.envNamePlaceholder')"
            class="env-name-input"
            @keyup.enter="createEnvironment"
          />
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showAddEnvModal = false">
            {{ t('postman.environments.cancel') }}
          </button>
          <button class="confirm-btn" @click="createEnvironment">
            {{ t('postman.environments.confirm') }}
          </button>
        </div>
        <div v-if="pendingImport" class="postman-confirm" role="alertdialog">
          <span>{{ t('postman.environments.envExistsConfirm', { env: pendingImport.name }) }}</span>
          <button type="button" @click="confirmImportReplace">{{ t('experience.confirm') }}</button>
          <button type="button" @click="pendingImport = null">{{ t('experience.cancel') }}</button>
        </div>
      </div>
    </div>
    <inline-feedback :feedback="feedback" />

    <!-- 导入模态框 -->
    <div v-if="showImportModal" class="modal-overlay" @click="showImportModal = false">
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-label="t('postman.environments.importTitle')"
        @click.stop
      >
        <div class="modal-header">
          <h3>{{ t('postman.environments.importTitle') }}</h3>
          <button
            class="close-btn"
            :aria-label="t('postman.environments.cancel')"
            @click="showImportModal = false"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <textarea
            v-model="importData"
            :placeholder="t('postman.environments.importPlaceholder')"
            class="import-textarea"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showImportModal = false">
            {{ t('postman.environments.cancel') }}
          </button>
          <button class="confirm-btn" @click="importEnvironment">
            {{ t('postman.environments.importConfirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'EnvironmentVariables',
};
</script>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { langManager } from '@/utils/i18n';
import type { PostmanEnvironment } from './types';
import { replaceEnvironmentVariables } from './utils/environment';
import InlineFeedback from '@/components/Experience/InlineFeedback.vue';
import type { InlineFeedbackMessage } from '@/types/experience';
import KeyValueEditor from './KeyValueEditor.vue';
import { normalizeEnvironment } from './utils/request-model';

const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);

const props = defineProps<{
  environments: PostmanEnvironment[];
  currentEnvironment?: string;
}>();

const emit = defineEmits<{
  'update:environments': [environments: PostmanEnvironment[]];
  'update:currentEnvironment': [envName: string];
  'variable-replaced': [text: string];
  feedback: [message: string, tone: 'success' | 'error'];
}>();

const isExpanded = ref(false);
const currentEnv = ref(props.currentEnvironment || '');
const showAddEnvModal = ref(false);
const showImportModal = ref(false);
const newEnvName = ref('');
const importData = ref('');
const pendingDelete = ref(false);
const pendingImport = ref<PostmanEnvironment | null>(null);
const feedback = ref<InlineFeedbackMessage | null>(null);

const report = (message: string, tone: 'success' | 'error') => {
  feedback.value = { message, tone };
  emit('feedback', message, tone);
};

const currentVariables = computed(() => {
  const env = props.environments.find(e => e.name === currentEnv.value);
  return env ? env.variables : [];
});

watch(
  () => props.currentEnvironment,
  newEnv => {
    currentEnv.value = newEnv || '';
  }
);

const toggleVariables = () => {
  isExpanded.value = !isExpanded.value;
};

const switchEnvironment = () => {
  emit('update:currentEnvironment', currentEnv.value);
};

const addVariable = () => {
  const env = props.environments.find(e => e.name === currentEnv.value);
  if (env) {
    env.variables.push({ key: '', value: '', description: '', enabled: true, secret: false });
    updateVariables();
  }
};

const updateCurrentVariables = (variables: PostmanEnvironment['variables']) => {
  const env = props.environments.find(e => e.name === currentEnv.value);
  if (env) {
    env.variables = variables;
    updateVariables();
  }
};

const updateVariables = () => {
  emit('update:environments', [...props.environments]);
};

const createEnvironment = () => {
  if (!newEnvName.value.trim()) return;

  const newEnv: PostmanEnvironment = {
    name: newEnvName.value.trim(),
    variables: [],
  };

  const updatedEnvs = [...props.environments, newEnv];
  emit('update:environments', updatedEnvs);

  currentEnv.value = newEnv.name;
  emit('update:currentEnvironment', newEnv.name);

  newEnvName.value = '';
  showAddEnvModal.value = false;
  report(t('postman.feedback.environmentSaved'), 'success');
};

const deleteEnvironment = () => {
  if (!currentEnv.value) return;
  pendingDelete.value = true;
};

const confirmDeleteEnvironment = () => {
  const updatedEnvs = props.environments.filter(e => e.name !== currentEnv.value);
  emit('update:environments', updatedEnvs);
  currentEnv.value = '';
  emit('update:currentEnvironment', '');
  pendingDelete.value = false;
  report(t('postman.feedback.environmentDeleted'), 'success');
};

const exportEnvironment = () => {
  const env = props.environments.find(e => e.name === currentEnv.value);
  if (!env) return;

  const safeEnvironment = {
    ...env,
    variables: env.variables.map(variable => ({
      ...variable,
      value: variable.secret ? '' : variable.value,
    })),
  };
  const dataStr = JSON.stringify(safeEnvironment, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${env.name}-environment.json`;
  link.click();

  URL.revokeObjectURL(url);
  report(t('postman.feedback.environmentExported'), 'success');
};

const applyImportedEnvironment = (envData: PostmanEnvironment) => {
  envData = normalizeEnvironment(envData);
  const existingIndex = props.environments.findIndex(e => e.name === envData.name);
  const updatedEnvs = [...props.environments];
  if (existingIndex >= 0) updatedEnvs[existingIndex] = envData;
  else updatedEnvs.push(envData);
  emit('update:environments', updatedEnvs);
  currentEnv.value = envData.name;
  emit('update:currentEnvironment', envData.name);
  importData.value = '';
  showImportModal.value = false;
  pendingImport.value = null;
  report(t('postman.feedback.environmentImported'), 'success');
};

const confirmImportReplace = () => {
  if (pendingImport.value) applyImportedEnvironment(pendingImport.value);
};

const importEnvironment = () => {
  try {
    const envData = JSON.parse(importData.value);

    if (!envData.name || !Array.isArray(envData.variables)) {
      throw new Error(t('postman.environments.invalidEnvData'));
    }

    if (props.environments.some(e => e.name === envData.name)) {
      pendingImport.value = envData as PostmanEnvironment;
      return;
    }
    applyImportedEnvironment(envData as PostmanEnvironment);
  } catch (error) {
    report(t('postman.environments.importFailed', { message: (error as Error).message }), 'error');
  }
};

/**
 * Expose helper methods for parent components.
 */
const replaceVariables = (text: string): string => {
  if (!currentEnv.value) return text;

  const env = props.environments.find(e => e.name === currentEnv.value);
  if (!env) return text;

  return replaceEnvironmentVariables(text, env.variables);
};

defineExpose({
  replaceVariables,
});
</script>

<style scoped src="./styles/environment-variables.scoped.css"></style>
