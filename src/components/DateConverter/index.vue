<template>
  <section class="date-converter" @click="stopPropagation">
    <div class="date-converter__header">
      <div class="date-converter__header-content">
        <h4 class="date-converter__title">
          {{ t('dateConverter.title') }}
          <button class="date-converter__back-btn" @click="handleBack">
            <i class="u-icon icon-home"></i>
            {{ t('common.backHome') }}
          </button>
        </h4>
        <p>{{ t('dateConverter.description') }}</p>
      </div>
    </div>

    <div class="date-converter__content">
      <!-- 输入区域 -->
      <div class="date-converter__panel">
        <div class="date-converter__panel-header">
          <span>{{ t('dateConverter.inputTime') }}</span>
          <span class="date-converter__btn-link" @click="useCurrentTime">{{
            t('dateConverter.useCurrentTime')
          }}</span>
        </div>

        <div class="date-converter__input-group">
          <div class="date-converter__radio-group">
            <label class="date-converter__radio">
              <input type="radio" v-model="inputType" value="timestamp" />
              <span>{{ t('dateConverter.inputTypes.timestamp') }}</span>
            </label>
            <label class="date-converter__radio">
              <input type="radio" v-model="inputType" value="iso" />
              <span>{{ t('dateConverter.inputTypes.iso') }}</span>
            </label>
            <label class="date-converter__radio">
              <input type="radio" v-model="inputType" value="local" />
              <span>{{ t('dateConverter.inputTypes.local') }}</span>
            </label>
            <label class="date-converter__radio">
              <input type="radio" v-model="inputType" value="custom" />
              <span>{{ t('dateConverter.inputTypes.custom') }}</span>
            </label>
          </div>

          <div class="date-converter__input-container">
            <template v-if="inputType === 'timestamp'">
              <input
                type="number"
                v-model.number="inputTimestamp"
                class="date-converter__input"
                :placeholder="t('dateConverter.placeholders.timestampSeconds')"
                @input="convertFromTimestamp"
              />
              <div class="date-converter__unit-selector">
                <label class="date-converter__radio">
                  <input
                    type="radio"
                    v-model="timestampUnit"
                    value="seconds"
                    @change="convertFromTimestamp"
                  />
                  <span>{{ t('dateConverter.units.seconds') }}</span>
                </label>
                <label class="date-converter__radio">
                  <input
                    type="radio"
                    v-model="timestampUnit"
                    value="milliseconds"
                    @change="convertFromTimestamp"
                  />
                  <span>{{ t('dateConverter.units.milliseconds') }}</span>
                </label>
              </div>
            </template>

            <template v-else-if="inputType === 'iso'">
              <input
                type="text"
                v-model="inputIso"
                class="date-converter__input"
                :placeholder="t('dateConverter.placeholders.iso')"
                @input="convertFromIso"
              />
            </template>

            <template v-else-if="inputType === 'local'">
              <input
                type="datetime-local"
                v-model="inputLocalString"
                class="date-converter__input"
                @input="convertFromLocalString"
              />
            </template>

            <template v-else-if="inputType === 'custom'">
              <div class="date-converter__custom-container">
                <input
                  type="text"
                  v-model="inputCustom"
                  class="date-converter__input"
                  :placeholder="t('dateConverter.placeholders.customInput')"
                  @input="convertFromCustom"
                />
                <input
                  type="text"
                  v-model="customFormat"
                  class="date-converter__format-input"
                  :placeholder="t('dateConverter.placeholders.customFormat')"
                  @input="convertFromCustom"
                />
              </div>
            </template>
          </div>
        </div>

        <div class="date-converter__error" v-if="error">
          {{ error }}
        </div>
      </div>

      <!-- 时区选择 -->
      <div class="date-converter__timezone-panel">
        <div class="date-converter__panel-header">
          <span>{{ t('dateConverter.timezoneTitle') }}</span>
        </div>
        <select
          v-model="selectedTimezone"
          class="date-converter__timezone-select"
          @change="updateAllOutputs"
        >
          <option v-for="tz in timezones" :key="tz.value" :value="tz.value">
            {{ tz.label }}
          </option>
        </select>
      </div>

      <!-- 输出区域 -->
      <div class="date-converter__output-panel">
        <div class="date-converter__panel-header">
          <span>{{ t('dateConverter.outputTitle') }}</span>
          <div class="date-converter__panel-controls">
            <span
              class="date-converter__btn-link"
              @click="copyToClipboard"
              :class="{ 'date-converter__btn-disabled': !hasValidDate }"
            >
              {{ t('common.copy') }}
            </span>
          </div>
        </div>

        <div class="date-converter__results">
          <div class="date-converter__result-item">
            <div class="date-converter__result-label">
              {{ t('dateConverter.resultLabels.timestampSeconds') }}
            </div>
            <div class="date-converter__result-value">{{ outputTimestampSeconds }}</div>
          </div>

          <div class="date-converter__result-item">
            <div class="date-converter__result-label">
              {{ t('dateConverter.resultLabels.timestampMilliseconds') }}
            </div>
            <div class="date-converter__result-value">{{ outputTimestampMilliseconds }}</div>
          </div>

          <div class="date-converter__result-item">
            <div class="date-converter__result-label">{{ t('dateConverter.resultLabels.iso') }}</div>
            <div class="date-converter__result-value">{{ outputIso }}</div>
          </div>

          <div class="date-converter__result-item">
            <div class="date-converter__result-label">{{ t('dateConverter.resultLabels.local') }}</div>
            <div class="date-converter__result-value">{{ outputLocal }}</div>
          </div>

          <div class="date-converter__result-item">
            <div class="date-converter__result-label">{{ t('dateConverter.resultLabels.utc') }}</div>
            <div class="date-converter__result-value">{{ outputUtc }}</div>
          </div>

          <div class="date-converter__result-item">
            <div class="date-converter__result-label">
              {{ t('dateConverter.resultLabels.relative') }}
            </div>
            <div class="date-converter__result-value">{{ outputRelative }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日期计算工具 -->
    <div class="date-converter__calculator">
      <div class="date-converter__panel-header">
        <span>{{ t('dateConverter.calculator.title') }}</span>
      </div>

      <div class="date-converter__calculator-content">
        <div class="date-converter__calculator-row">
          <span class="date-converter__calculator-label">
            {{ t('dateConverter.calculator.label') }}
          </span>
          <input
            type="number"
            v-model.number="calculationValue"
            class="date-converter__calculator-input"
          />
          <select v-model="calculationUnit" class="date-converter__calculator-unit">
            <option value="seconds">{{ t('dateConverter.units.seconds') }}</option>
            <option value="minutes">{{ t('dateConverter.units.minutes') }}</option>
            <option value="hours">{{ t('dateConverter.units.hours') }}</option>
            <option value="days">{{ t('dateConverter.units.days') }}</option>
            <option value="weeks">{{ t('dateConverter.units.weeks') }}</option>
            <option value="months">{{ t('dateConverter.units.months') }}</option>
            <option value="years">{{ t('dateConverter.units.years') }}</option>
          </select>
          <button class="u-btn_il" s-color="blue" @click="calculateDate(true)">
            {{ t('dateConverter.calculator.add') }}
          </button>
          <button class="u-btn_il" @click="calculateDate(false)">
            {{ t('dateConverter.calculator.subtract') }}
          </button>
        </div>

        <div class="date-converter__calculator-result" v-if="calculationResult">
          <div class="date-converter__result-label">
            {{ t('dateConverter.resultLabels.calculationResult') }}
          </div>
          <div class="date-converter__result-value">{{ calculationResult }}</div>
        </div>
      </div>
    </div>

    <div class="date-converter__tips">
      <h4>{{ t('dateConverter.tips.title') }}</h4>
      <ul>
        <li>{{ t('dateConverter.tips.item1') }}</li>
        <li>{{ t('dateConverter.tips.item2') }}</li>
        <li>{{ t('dateConverter.tips.item3') }}</li>
        <li>{{ t('dateConverter.tips.item4') }}</li>
      </ul>
    </div>

    <div v-if="successVisible" class="date-converter__success-modal">
      <div class="date-converter__modal-content">
        <h4>{{ t('dateConverter.modal.successTitle') }}</h4>
        <p>{{ successMessage }}</p>
        <button class="u-btn_il" s-color="blue" @click="successVisible = false">
          {{ t('common.ok') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { langManager } from '@/utils/i18n';

const t = (key: string, params?: Record<string, string | number>) =>
  langManager.t(key, params);
import DOMPurify from 'dompurify';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// 扩展dayjs插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

defineOptions({
  name: 'DateConverter',
});

// 接收返回主页的方法
const props = defineProps<{
  back?: () => void;
}>();

// 状态变量
const inputType = ref('timestamp');
const inputTimestamp = ref<number | null>(null);
const inputIso = ref('');
const inputLocalString = ref(''); // 使用字符串来存储HTML datetime-local的值
const inputCustom = ref('');
const customFormat = ref('YYYY-MM-DD HH:mm:ss');
const timestampUnit = ref('seconds');
const selectedTimezone = ref('Asia/Shanghai');
const error = ref('');
const currentDate = ref<dayjs.Dayjs | null>(null);
const successVisible = ref(false);
const successMessage = ref('');

// 计算器相关变量
const calculationValue = ref<number | null>(1);
const calculationUnit = ref('days');
const calculationResult = ref('');

// 时区列表
const timezones = computed(() => [
  { value: 'Asia/Shanghai', label: t('dateConverter.timezones.asiaShanghai') },
  { value: 'Asia/Tokyo', label: t('dateConverter.timezones.asiaTokyo') },
  { value: 'Europe/London', label: t('dateConverter.timezones.europeLondon') },
  { value: 'Europe/Paris', label: t('dateConverter.timezones.europeParis') },
  { value: 'America/New_York', label: t('dateConverter.timezones.americaNewYork') },
  { value: 'America/Los_Angeles', label: t('dateConverter.timezones.americaLosAngeles') },
  { value: 'UTC', label: t('dateConverter.timezones.utc') },
]);

// 计算属性
const hasValidDate = computed(() => currentDate.value !== null);

const outputTimestampSeconds = computed(() => {
  if (!currentDate.value) return '';
  return Math.floor(currentDate.value.valueOf() / 1000);
});

const outputTimestampMilliseconds = computed(() => {
  if (!currentDate.value) return '';
  return currentDate.value.valueOf();
});

const outputIso = computed(() => {
  if (!currentDate.value) return '';
  return currentDate.value.toISOString();
});

const outputLocal = computed(() => {
  if (!currentDate.value) return '';
  return currentDate.value.tz(selectedTimezone.value).format('YYYY-MM-DD HH:mm:ss');
});

const outputUtc = computed(() => {
  if (!currentDate.value) return '';
  return currentDate.value.utc().format('YYYY-MM-DD HH:mm:ss');
});

const outputRelative = computed(() => {
  if (!currentDate.value) return '';
  return currentDate.value.fromNow();
});

// 初始化
onMounted(() => {
  useCurrentTime();
});

// 防止事件冒泡
const stopPropagation = (e: Event) => {
  e.stopPropagation();
};

// 使用当前时间
const useCurrentTime = () => {
  error.value = '';
  currentDate.value = dayjs();

  // 更新各输入框的值
  inputTimestamp.value = Math.floor(currentDate.value.valueOf() / 1000);
  inputIso.value = currentDate.value.toISOString();
  inputLocalString.value = currentDate.value.format('YYYY-MM-DDTHH:mm');
  inputCustom.value = currentDate.value.format(customFormat.value);
};

// 从时间戳转换
const convertFromTimestamp = () => {
  error.value = '';
  if (inputTimestamp.value === null) {
    currentDate.value = null;
    return;
  }

  try {
    const timestamp =
      timestampUnit.value === 'seconds' ? inputTimestamp.value * 1000 : inputTimestamp.value;

    currentDate.value = dayjs(timestamp);

    // 更新其他输入框
    inputIso.value = currentDate.value.toISOString();
    inputLocalString.value = currentDate.value.format('YYYY-MM-DDTHH:mm');
    inputCustom.value = currentDate.value.format(customFormat.value);
  } catch (e) {
    error.value = t('dateConverter.messages.convertFailed', { message: (e as Error).message });
    currentDate.value = null;
  }
};

// 从ISO格式转换
const convertFromIso = () => {
  error.value = '';
  if (!inputIso.value) {
    currentDate.value = null;
    return;
  }

  try {
    // 使用DOMPurify清理输入
    const sanitizedInput = DOMPurify.sanitize(inputIso.value);
    currentDate.value = dayjs(sanitizedInput);

    if (!currentDate.value.isValid()) {
      throw new Error(t('dateConverter.messages.invalidIso'));
    }

    // 更新其他输入框
    inputTimestamp.value = Math.floor(currentDate.value.valueOf() / 1000);
    inputLocalString.value = currentDate.value.format('YYYY-MM-DDTHH:mm');
    inputCustom.value = currentDate.value.format(customFormat.value);
  } catch (e) {
    error.value = t('dateConverter.messages.convertFailed', { message: (e as Error).message });
    currentDate.value = null;
  }
};

// 从本地时间字符串转换
const convertFromLocalString = () => {
  error.value = '';
  if (!inputLocalString.value) {
    currentDate.value = null;
    return;
  }

  try {
    currentDate.value = dayjs(inputLocalString.value);

    if (!currentDate.value.isValid()) {
      throw new Error(t('dateConverter.messages.invalidDate'));
    }

    // 更新其他输入框
    inputTimestamp.value = Math.floor(currentDate.value.valueOf() / 1000);
    inputIso.value = currentDate.value.toISOString();
    inputCustom.value = currentDate.value.format(customFormat.value);
  } catch (e) {
    error.value = t('dateConverter.messages.convertFailed', { message: (e as Error).message });
    currentDate.value = null;
  }
};

// 从自定义格式转换
const convertFromCustom = () => {
  error.value = '';
  if (!inputCustom.value || !customFormat.value) {
    currentDate.value = null;
    return;
  }

  try {
    // 使用DOMPurify清理输入
    const sanitizedInput = DOMPurify.sanitize(inputCustom.value);
    const sanitizedFormat = DOMPurify.sanitize(customFormat.value);

    currentDate.value = dayjs(sanitizedInput, sanitizedFormat);

    if (!currentDate.value.isValid()) {
      throw new Error(t('dateConverter.messages.invalidDate'));
    }

    // 更新其他输入框
    inputTimestamp.value = Math.floor(currentDate.value.valueOf() / 1000);
    inputIso.value = currentDate.value.toISOString();
    inputLocalString.value = currentDate.value.format('YYYY-MM-DDTHH:mm');
  } catch (e) {
    error.value = t('dateConverter.messages.convertFailed', { message: (e as Error).message });
    currentDate.value = null;
  }
};

// 更新所有输出
const updateAllOutputs = () => {
  if (!currentDate.value) return;

  // 不需要额外操作，因为计算属性会自动更新
};

// 日期计算
const calculateDate = (isAdd: boolean) => {
  if (!currentDate.value || calculationValue.value === null) {
    error.value = t('dateConverter.messages.calculateRequired');
    return;
  }

  try {
    const value = isAdd ? calculationValue.value : -calculationValue.value;
    const result = currentDate.value.add(value, calculationUnit.value as dayjs.ManipulateType);

    calculationResult.value = `${result.format('YYYY-MM-DD HH:mm:ss')} (${result.fromNow()})`;
  } catch (e) {
    error.value = t('dateConverter.messages.calculateFailed', { message: (e as Error).message });
  }
};

// 复制到剪贴板
const copyToClipboard = () => {
  if (!currentDate.value) return;

  const textToCopy = `${t('dateConverter.resultLabels.timestampSeconds')} ${outputTimestampSeconds.value}
${t('dateConverter.resultLabels.timestampMilliseconds')} ${outputTimestampMilliseconds.value}
${t('dateConverter.resultLabels.iso')} ${outputIso.value}
${t('dateConverter.resultLabels.local')} (${selectedTimezone.value}): ${outputLocal.value}
${t('dateConverter.resultLabels.utc')} ${outputUtc.value}
${t('dateConverter.resultLabels.relative')} ${outputRelative.value}`;

  try {
    navigator.clipboard.writeText(textToCopy);
    showSuccess(t('dateConverter.messages.copySuccess'));
  } catch (e) {
    error.value = t('dateConverter.messages.copyFailed', { message: (e as Error).message });
  }
};

// 显示成功消息
const showSuccess = (message: string) => {
  successMessage.value = message;
  successVisible.value = true;
  setTimeout(() => {
    successVisible.value = false;
  }, 2000);
};

// 返回主页
const handleBack = () => {
  if (props.back) {
    props.back();
  }
};
</script>

<style lang="less" scoped>
.date-converter {
  padding: 22px 26px 18px;
  max-width: 880px;
  margin: 0 auto;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  height: calc(100vh - 40px); /* Set a fixed height with some padding */
  overflow-y: auto; /* Add vertical scrollbar when content exceeds height */
  scrollbar-width: thin; /* For Firefox */
  scrollbar-color: #bbb #f5f5f5; /* For Firefox */
  background: linear-gradient(180deg, #ffffff 0%, #f5f8ff 100%);
  border: 1px solid #e2e9ff;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(30, 74, 173, 0.12);

  /* Webkit scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #bbb;
    border-radius: 4px;
    border: 2px solid #f5f5f5;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #999;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    position: sticky;
    top: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(245, 248, 255, 0.96) 100%);
    padding: 6px 0;
    z-index: 10;

    &-content {
      h4.date-converter__title {
        margin: 0 0 6px;
        font-size: 16px;
        font-weight: 600;
        color: #1f2a44;
      }

      p {
        margin: 0;
        color: #6b7a99;
        font-size: 13px;
      }
    }
  }

  &__back-btn {
    flex-shrink: 0;
    font-size: 13px;
    padding: 6px 10px;
    background-color: #fff;
    color: #2969f7;
    border: 1px solid #dbe3f9;
    border-radius: 10px;
    cursor: pointer;
    display: inline-block;
    gap: 4px;
    box-shadow: 0 6px 14px rgba(28, 63, 124, 0.08);
    transition: transform 0.15s ease, box-shadow 0.15s ease, color 0.15s ease,
      border-color 0.15s ease;

    &:hover {
      color: #1f55d1;
      border-color: #b9c7ef;
      transform: translateY(-1px);
      box-shadow: 0 10px 18px rgba(41, 105, 247, 0.18);
    }

    i {
      font-size: 12px;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 16px;
  }

  &__panel,
  &__timezone-panel,
  &__output-panel,
  &__calculator {
    background-color: #fff;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #e4e9f7;
    box-shadow: 0 6px 14px rgba(28, 63, 124, 0.06);
    transition: box-shadow 0.2s ease, transform 0.2s ease;

    &:hover {
      box-shadow: 0 10px 20px rgba(28, 63, 124, 0.12);
      transform: translateY(-1px);
    }
  }

  &__panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-weight: 600;
    border-bottom: 1px solid #e2e9ff;
    padding-bottom: 8px;

    span {
      font-size: 16px;
      color: #1f2a44;
    }
  }

  &__btn-link {
    color: #2969f7;
    cursor: pointer;
    font-size: 14px;
    transition: color 0.2s;

    &:hover {
      text-decoration: underline;
      color: #1f55d1;
    }

    &.date-converter__btn-disabled {
      color: #ccc;
      cursor: not-allowed;

      &:hover {
        text-decoration: none;
      }
    }
  }

  &__input-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__radio {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f3f6ff;
    }

    input {
      margin-right: 4px;
    }
  }

  &__input-container {
    margin-top: 8px;
  }

  &__input {
    width: 100%;
    padding: 10px;
    border: 1px solid #dbe3f9;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s;

    &:focus {
      border-color: #2969f7;
      outline: none;
      box-shadow: 0 0 0 3px rgba(41, 105, 247, 0.18);
    }
  }

  &__unit-selector {
    margin-top: 8px;
    display: flex;
    gap: 16px;
  }

  &__custom-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__format-input {
    padding: 10px;
    border: 1px solid #dbe3f9;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s;

    &:focus {
      border-color: #2969f7;
      outline: none;
      box-shadow: 0 0 0 3px rgba(41, 105, 247, 0.18);
    }
  }

  &__timezone-select {
    width: 100%;
    padding: 10px;
    border: 1px solid #dbe3f9;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s;

    &:focus {
      border-color: #2969f7;
      outline: none;
      box-shadow: 0 0 0 3px rgba(41, 105, 247, 0.18);
    }
  }

  &__results {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 4px;

    /* Nested scrollbar styling */
    scrollbar-width: thin;
    scrollbar-color: #ddd #f9f9f9;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f9f9f9;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #ddd;
      border-radius: 3px;
    }
  }

  &__result-item {
    display: flex;
    align-items: center;
    padding: 10px;
    background-color: #fff;
    border-radius: 10px;
    border: 1px solid #e4e9f7;
    transition:
      transform 0.2s,
      box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(28, 63, 124, 0.12);
    }
  }

  &__result-label {
    width: 180px;
    font-weight: 500;
    color: #4a5a78;
  }

  &__result-value {
    flex: 1;
    word-break: break-all;
    font-family: monospace;
    padding: 4px 8px;
    background-color: #f6f8ff;
    border-radius: 6px;
    border: 1px solid #e2e9ff;
    color: #2b3a55;
  }

  &__calculator {
    margin-bottom: 16px;

    &-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    &-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    &-label {
      min-width: 80px;
      font-weight: 500;
    }

    &-input {
      width: 120px;
      padding: 10px;
      border: 1px solid #dbe3f9;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s;

      &:focus {
        border-color: #2969f7;
        outline: none;
        box-shadow: 0 0 0 3px rgba(41, 105, 247, 0.18);
      }
    }

    &-unit {
      width: 100px;
      padding: 10px;
      border: 1px solid #dbe3f9;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s;

      &:focus {
        border-color: #2969f7;
        outline: none;
        box-shadow: 0 0 0 3px rgba(41, 105, 247, 0.18);
      }
    }

    &-result {
      display: flex;
      align-items: center;
      padding: 12px;
      background-color: #eef4ff;
      border-radius: 10px;
      border: 1px solid #cfe0ff;
      color: #1f2a44;
    }
  }

  &__error {
    margin-top: 12px;
    color: #f5222d;
    font-size: 14px;
    padding: 8px;
    background-color: #fff2f0;
    border-radius: 4px;
    border: 1px solid #ffccc7;
  }

  &__tips {
    background-color: #f6f8ff;
    border-radius: 12px;
    padding: 16px;
    margin-top: 16px;
    border-left: 4px solid #2969f7;

    h4 {
      margin-top: 0;
      margin-bottom: 8px;
      color: #1f2a44;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        margin-bottom: 6px;
        color: #6b7a99;
      }
    }
  }

  &__success-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  &__modal-content {
    background-color: #fff;
    border-radius: 12px;
    padding: 20px;
    width: 300px;
    text-align: center;
    box-shadow: 0 12px 24px rgba(28, 63, 124, 0.18);
    animation: slideUp 0.3s ease;

    h4 {
      margin-top: 0;
      margin-bottom: 16px;
      color: #2fb36b;
    }

    p {
      margin-bottom: 20px;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    padding: 16px;
    height: calc(100vh - 24px);

    &__result-item {
      flex-direction: column;
      align-items: flex-start;
    }

    &__result-label {
      // width: 100%;
      margin-bottom: 4px;
    }

    &__calculator-row {
      flex-direction: column;
      align-items: flex-start;

      > * {
        margin-bottom: 8px;
        width: 100%;
      }
    }

    &__radio-group {
      flex-direction: column;
      align-items: flex-start;
    }

    &__header {
      flex-direction: column;
      align-items: flex-start;

      &-content {
        margin-bottom: 12px;
      }
    }
  }
}

.date-converter .u-btn_il {
  min-width: 140px;
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid #dbe3f9;
  background: #fff;
  color: #2b3a55;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(28, 63, 124, 0.08);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease,
    color 0.15s ease, border-color 0.15s ease;
}

.date-converter .u-btn_il:hover {
  transform: translateY(-1px);
  border-color: #b9c7ef;
}

.date-converter .u-btn_il[s-color='blue'] {
  background: linear-gradient(135deg, #2969f7 0%, #4d7fff 100%);
  border-color: #2c66f7;
  color: #fff;
  box-shadow: 0 10px 18px rgba(41, 105, 247, 0.25);
}

.date-converter .u-btn_il[s-color='blue']:hover {
  box-shadow: 0 14px 24px rgba(41, 105, 247, 0.32);
}
</style>
