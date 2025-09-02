<template>
  <div class="environment-variables">
    <div class="env-header">
      <h3>环境变量</h3>
      <div class="env-actions">
        <select v-model="currentEnv" @change="switchEnvironment" class="env-select">
          <option value="">选择环境</option>
          <option v-for="env in environments" :key="env.name" :value="env.name">
            {{ env.name }}
          </option>
        </select>
        <button @click="showAddEnvModal = true" class="add-env-btn">
          <i class="fas fa-plus"></i> 新建环境
        </button>
        <button @click="toggleVariables" class="toggle-btn">
          <i :class="['fas', isExpanded ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
        </button>
      </div>
    </div>

    <div v-if="isExpanded" class="env-content">
      <div v-if="!currentEnv" class="no-env-selected">
        <i class="fas fa-cog"></i>
        <p>请选择或创建一个环境</p>
      </div>

      <div v-else class="variables-section">
        <div class="section-header">
          <h4>{{ currentEnv }} 环境变量</h4>
          <button @click="addVariable" class="add-var-btn">
            <i class="fas fa-plus"></i> 添加变量
          </button>
        </div>

        <div class="variables-list">
          <div v-for="(variable, index) in currentVariables" :key="index" class="variable-item">
            <input
              v-model="variable.key"
              placeholder="变量名"
              class="var-input"
              @input="updateVariables"
            />
            <input
              v-model="variable.value"
              placeholder="变量值"
              class="var-input"
              @input="updateVariables"
            />
            <input
              v-model="variable.description"
              placeholder="描述（可选）"
              class="var-input description"
              @input="updateVariables"
            />
            <button @click="removeVariable(index)" class="remove-btn">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="env-actions-bottom">
          <button @click="exportEnvironment" class="export-btn">
            <i class="fas fa-download"></i> 导出
          </button>
          <button @click="showImportModal = true" class="import-btn">
            <i class="fas fa-upload"></i> 导入
          </button>
          <button @click="deleteEnvironment" class="delete-env-btn">
            <i class="fas fa-trash"></i> 删除环境
          </button>
        </div>
      </div>
    </div>

    <!-- 新建环境模态框 -->
    <div v-if="showAddEnvModal" class="modal-overlay" @click="showAddEnvModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>新建环境</h3>
          <button @click="showAddEnvModal = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <input
            v-model="newEnvName"
            placeholder="环境名称"
            class="env-name-input"
            @keyup.enter="createEnvironment"
          />
        </div>
        <div class="modal-footer">
          <button @click="showAddEnvModal = false" class="cancel-btn">取消</button>
          <button @click="createEnvironment" class="confirm-btn">创建</button>
        </div>
      </div>
    </div>

    <!-- 导入模态框 -->
    <div v-if="showImportModal" class="modal-overlay" @click="showImportModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>导入环境变量</h3>
          <button @click="showImportModal = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <textarea
            v-model="importData"
            placeholder="粘贴 JSON 格式的环境变量数据"
            class="import-textarea"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="showImportModal = false" class="cancel-btn">取消</button>
          <button @click="importEnvironment" class="confirm-btn">导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { langManager } from '@/utils/i18n';

const t = (key: string) => langManager.t(key);

interface Variable {
  key: string;
  value: string;
  description?: string;
}

interface Environment {
  name: string;
  variables: Variable[];
}

const props = defineProps<{
  environments: Environment[];
  currentEnvironment?: string;
}>();

const emit = defineEmits<{
  'update:environments': [environments: Environment[]];
  'update:currentEnvironment': [envName: string];
  'variable-replaced': [text: string];
}>();

const isExpanded = ref(false);
const currentEnv = ref(props.currentEnvironment || '');
const showAddEnvModal = ref(false);
const showImportModal = ref(false);
const newEnvName = ref('');
const importData = ref('');

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
    env.variables.push({ key: '', value: '', description: '' });
    updateVariables();
  }
};

const removeVariable = (index: number) => {
  const env = props.environments.find(e => e.name === currentEnv.value);
  if (env) {
    env.variables.splice(index, 1);
    updateVariables();
  }
};

const updateVariables = () => {
  emit('update:environments', [...props.environments]);
};

const createEnvironment = () => {
  if (!newEnvName.value.trim()) return;

  const newEnv: Environment = {
    name: newEnvName.value.trim(),
    variables: [],
  };

  const updatedEnvs = [...props.environments, newEnv];
  emit('update:environments', updatedEnvs);

  currentEnv.value = newEnv.name;
  emit('update:currentEnvironment', newEnv.name);

  newEnvName.value = '';
  showAddEnvModal.value = false;
};

const deleteEnvironment = () => {
  if (!currentEnv.value) return;

  if (confirm(`确定要删除环境 "${currentEnv.value}" 吗？`)) {
    const updatedEnvs = props.environments.filter(e => e.name !== currentEnv.value);
    emit('update:environments', updatedEnvs);

    currentEnv.value = '';
    emit('update:currentEnvironment', '');
  }
};

const exportEnvironment = () => {
  const env = props.environments.find(e => e.name === currentEnv.value);
  if (!env) return;

  const dataStr = JSON.stringify(env, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${env.name}-environment.json`;
  link.click();

  URL.revokeObjectURL(url);
};

const importEnvironment = () => {
  try {
    const envData = JSON.parse(importData.value);

    if (!envData.name || !Array.isArray(envData.variables)) {
      throw new Error('无效的环境数据格式');
    }

    const existingIndex = props.environments.findIndex(e => e.name === envData.name);
    let updatedEnvs;

    if (existingIndex >= 0) {
      if (confirm(`环境 "${envData.name}" 已存在，是否覆盖？`)) {
        updatedEnvs = [...props.environments];
        updatedEnvs[existingIndex] = envData;
      } else {
        return;
      }
    } else {
      updatedEnvs = [...props.environments, envData];
    }

    emit('update:environments', updatedEnvs);

    currentEnv.value = envData.name;
    emit('update:currentEnvironment', envData.name);

    importData.value = '';
    showImportModal.value = false;
  } catch (error) {
    alert('导入失败：' + (error as Error).message);
  }
};

// 提供给父组件使用的方法
const replaceVariables = (text: string): string => {
  if (!currentEnv.value) return text;

  const env = props.environments.find(e => e.name === currentEnv.value);
  if (!env) return text;

  let result = text;
  env.variables.forEach(variable => {
    if (variable.key && variable.value) {
      const regex = new RegExp(`{{\\s*${variable.key}\\s*}}`, 'g');
      result = result.replace(regex, variable.value);
    }
  });

  return result;
};

defineExpose({
  replaceVariables,
});
</script>

<style scoped>
.environment-variables {
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 20px;
}

.env-header {
  background: #f8f9fa;
  padding: 15px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.env-header h3 {
  margin: 0;
  color: #333;
}

.env-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.env-select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.add-env-btn,
.toggle-btn {
  padding: 5px 10px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.add-env-btn:hover,
.toggle-btn:hover {
  background: #f8f9fa;
}

.env-content {
  padding: 20px;
}

.no-env-selected {
  text-align: center;
  color: #6c757d;
  padding: 40px;
}

.no-env-selected i {
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0;
  color: #333;
}

.add-var-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.add-var-btn:hover {
  background: #0056b3;
}

.variables-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.variable-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.var-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.var-input:not(.description) {
  flex: 1;
}

.var-input.description {
  flex: 1.5;
}

.var-input:focus {
  outline: none;
  border-color: #007bff;
}

.remove-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #c82333;
}

.env-actions-bottom {
  display: flex;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.export-btn,
.import-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.import-btn {
  background: #17a2b8;
}

.delete-env-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-left: auto;
}

.export-btn:hover {
  background: #218838;
}

.import-btn:hover {
  background: #138496;
}

.delete-env-btn:hover {
  background: #c82333;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6c757d;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.env-name-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.import-textarea {
  width: 100%;
  min-height: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn,
.confirm-btn {
  padding: 8px 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background: white;
  color: #6c757d;
}

.confirm-btn {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.cancel-btn:hover {
  background: #f8f9fa;
}

.confirm-btn:hover {
  background: #0056b3;
}
</style>
