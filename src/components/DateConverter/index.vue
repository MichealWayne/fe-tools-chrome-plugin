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
              <span>Unix时间戳</span>
            </label>
            <label class="date-converter__radio">
              <input type="radio" v-model="inputType" value="iso" />
              <span>ISO格式</span>
            </label>
            <label class="date-converter__radio">
              <input type="radio" v-model="inputType" value="local" />
              <span>本地时间</span>
            </label>
            <label class="date-converter__radio">
              <input type="radio" v-model="inputType" value="custom" />
              <span>自定义格式</span>
            </label>
          </div>

          <div class="date-converter__input-container">
            <template v-if="inputType === 'timestamp'">
              <input
                type="number"
                v-model.number="inputTimestamp"
                class="date-converter__input"
                placeholder="Unix时间戳（秒）"
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
                  <span>秒</span>
                </label>
                <label class="date-converter__radio">
                  <input
                    type="radio"
                    v-model="timestampUnit"
                    value="milliseconds"
                    @change="convertFromTimestamp"
                  />
                  <span>毫秒</span>
                </label>
              </div>
            </template>

            <template v-else-if="inputType === 'iso'">
              <input
                type="text"
                v-model="inputIso"
                class="date-converter__input"
                placeholder="ISO格式 (YYYY-MM-DDTHH:mm:ss.sssZ)"
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
                  placeholder="输入日期字符串"
                  @input="convertFromCustom"
                />
                <input
                  type="text"
                  v-model="customFormat"
                  class="date-converter__format-input"
                  placeholder="格式 (例如: YYYY-MM-DD HH:mm:ss)"
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
          <span>时区设置</span>
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
          <span>转换结果</span>
          <div class="date-converter__panel-controls">
            <span
              class="date-converter__btn-link"
              @click="copyToClipboard"
              :class="{ 'date-converter__btn-disabled': !hasValidDate }"
            >
              复制
            </span>
          </div>
        </div>

        <div class="date-converter__results">
          <div class="date-converter__result-item">
            <div class="date-converter__result-label">Unix时间戳（秒）:</div>
            <div class="date-converter__result-value">{{ outputTimestampSeconds }}</div>
          </div>

          <div class="date-converter__result-item">
            <div class="date-converter__result-label">Unix时间戳（毫秒）:</div>
            <div class="date-converter__result-value">{{ outputTimestampMilliseconds }}</div>
          </div>

          <div class="date-converter__result-item">
            <div class="date-converter__result-label">ISO格式:</div>
            <div class="date-converter__result-value">{{ outputIso }}</div>
          </div>

          <div class="date-converter__result-item">
            <div class="date-converter__result-label">本地时间:</div>
            <div class="date-converter__result-value">{{ outputLocal }}</div>
          </div>

          <div class="date-converter__result-item">
            <div class="date-converter__result-label">UTC时间:</div>
            <div class="date-converter__result-value">{{ outputUtc }}</div>
          </div>

          <div class="date-converter__result-item">
            <div class="date-converter__result-label">相对时间:</div>
            <div class="date-converter__result-value">{{ outputRelative }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日期计算工具 -->
    <div class="date-converter__calculator">
      <div class="date-converter__panel-header">
        <span>日期计算</span>
      </div>

      <div class="date-converter__calculator-content">
        <div class="date-converter__calculator-row">
          <span class="date-converter__calculator-label">添加/减去:</span>
          <input
            type="number"
            v-model.number="calculationValue"
            class="date-converter__calculator-input"
          />
          <select v-model="calculationUnit" class="date-converter__calculator-unit">
            <option value="seconds">秒</option>
            <option value="minutes">分钟</option>
            <option value="hours">小时</option>
            <option value="days">天</option>
            <option value="weeks">周</option>
            <option value="months">月</option>
            <option value="years">年</option>
          </select>
          <button class="u-btn_il" s-color="blue" @click="calculateDate(true)">添加</button>
          <button class="u-btn_il" @click="calculateDate(false)">减去</button>
        </div>

        <div class="date-converter__calculator-result" v-if="calculationResult">
          <div class="date-converter__result-label">计算结果:</div>
          <div class="date-converter__result-value">{{ calculationResult }}</div>
        </div>
      </div>
    </div>

    <div class="date-converter__tips">
      <h4>使用提示：</h4>
      <ul>
        <li>Unix时间戳是从1970年1月1日UTC开始计算的秒数</li>
        <li>ISO格式遵循国际标准，包含时区信息</li>
        <li>时区转换会影响显示的本地时间</li>
        <li>日期计算可用于计算未来或过去的日期</li>
      </ul>
    </div>

    <div v-if="successVisible" class="date-converter__success-modal">
      <div class="date-converter__modal-content">
        <h4>操作成功</h4>
        <p>{{ successMessage }}</p>
        <button class="u-btn_il" s-color="blue" @click="successVisible = false">确定</button>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { langManager } from '@/utils/i18n';

const t = (key: string) => langManager.t(key);
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
const timezones = [
  { value: 'Asia/Shanghai', label: '中国标准时间 (UTC+8)' },
  { value: 'Asia/Tokyo', label: '日本标准时间 (UTC+9)' },
  { value: 'Europe/London', label: '英国标准时间 (UTC+0/+1)' },
  { value: 'Europe/Paris', label: '中欧标准时间 (UTC+1/+2)' },
  { value: 'America/New_York', label: '美国东部时间 (UTC-5/-4)' },
  { value: 'America/Los_Angeles', label: '美国太平洋时间 (UTC-8/-7)' },
  { value: 'UTC', label: '协调世界时 (UTC)' },
];

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
    error.value = `转换失败：${(e as Error).message}`;
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
      throw new Error('无效的ISO日期格式');
    }

    // 更新其他输入框
    inputTimestamp.value = Math.floor(currentDate.value.valueOf() / 1000);
    inputLocalString.value = currentDate.value.format('YYYY-MM-DDTHH:mm');
    inputCustom.value = currentDate.value.format(customFormat.value);
  } catch (e) {
    error.value = `转换失败：${(e as Error).message}`;
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
      throw new Error('无效的日期格式');
    }

    // 更新其他输入框
    inputTimestamp.value = Math.floor(currentDate.value.valueOf() / 1000);
    inputIso.value = currentDate.value.toISOString();
    inputCustom.value = currentDate.value.format(customFormat.value);
  } catch (e) {
    error.value = `转换失败：${(e as Error).message}`;
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
      throw new Error('无效的日期格式');
    }

    // 更新其他输入框
    inputTimestamp.value = Math.floor(currentDate.value.valueOf() / 1000);
    inputIso.value = currentDate.value.toISOString();
    inputLocalString.value = currentDate.value.format('YYYY-MM-DDTHH:mm');
  } catch (e) {
    error.value = `转换失败：${(e as Error).message}`;
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
    error.value = '请先输入有效的日期和计算值';
    return;
  }

  try {
    const value = isAdd ? calculationValue.value : -calculationValue.value;
    const result = currentDate.value.add(value, calculationUnit.value as dayjs.ManipulateType);

    calculationResult.value = `${result.format('YYYY-MM-DD HH:mm:ss')} (${result.fromNow()})`;
  } catch (e) {
    error.value = `计算失败：${(e as Error).message}`;
  }
};

// 复制到剪贴板
const copyToClipboard = () => {
  if (!currentDate.value) return;

  const textToCopy = `Unix时间戳(秒): ${outputTimestampSeconds.value}
Unix时间戳(毫秒): ${outputTimestampMilliseconds.value}
ISO格式: ${outputIso.value}
本地时间(${selectedTimezone.value}): ${outputLocal.value}
UTC时间: ${outputUtc.value}
相对时间: ${outputRelative.value}`;

  try {
    navigator.clipboard.writeText(textToCopy);
    showSuccess('已复制到剪贴板！');
  } catch (e) {
    error.value = `复制失败：${(e as Error).message}`;
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
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
  height: calc(100vh - 40px); /* Set a fixed height with some padding */
  overflow-y: auto; /* Add vertical scrollbar when content exceeds height */
  scrollbar-width: thin; /* For Firefox */
  scrollbar-color: #bbb #f5f5f5; /* For Firefox */

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
    background-color: #fff;
    padding: 6px 0;
    z-index: 10;

    &-content {
      h4.date-converter__title {
        margin: 0 0 6px;
        font-size: 16px;
        font-weight: 500;
      }

      p {
        margin: 0;
        color: #666;
        font-size: 13px;
      }
    }
  }

  &__back-btn {
    flex-shrink: 0;
    font-size: 13px;
    padding: 4px 8px;
    background-color: #f0f7ff;
    color: #1890ff;
    border: 1px solid #d6e8ff;
    border-radius: 4px;
    cursor: pointer;
    display: inline-block;
    gap: 4px;
    transition: all 0.2s;

    &:hover {
      background-color: #e6f4ff;
      color: #0c7ad9;
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
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.3s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }

  &__panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-weight: 500;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;

    span {
      font-size: 16px;
    }
  }

  &__btn-link {
    color: #1890ff;
    cursor: pointer;
    font-size: 14px;
    transition: color 0.2s;

    &:hover {
      text-decoration: underline;
      color: #40a9ff;
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
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f0f0f0;
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
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.3s;

    &:focus {
      border-color: #40a9ff;
      outline: none;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
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
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.3s;

    &:focus {
      border-color: #40a9ff;
      outline: none;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  &__timezone-select {
    width: 100%;
    padding: 10px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.3s;

    &:focus {
      border-color: #40a9ff;
      outline: none;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
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
    border-radius: 4px;
    border: 1px solid #eee;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
  }

  &__result-label {
    width: 180px;
    font-weight: 500;
    color: #555;
  }

  &__result-value {
    flex: 1;
    word-break: break-all;
    font-family: monospace;
    padding: 4px 8px;
    background-color: #f9f9f9;
    border-radius: 3px;
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
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 14px;
      transition: all 0.3s;

      &:focus {
        border-color: #40a9ff;
        outline: none;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }
    }

    &-unit {
      width: 100px;
      padding: 10px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 14px;
      transition: all 0.3s;

      &:focus {
        border-color: #40a9ff;
        outline: none;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }
    }

    &-result {
      display: flex;
      align-items: center;
      padding: 12px;
      background-color: #f0f8ff;
      border-radius: 4px;
      border: 1px solid #d0e6ff;
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
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
    border-left: 4px solid #1890ff;

    h4 {
      margin-top: 0;
      margin-bottom: 8px;
      color: #1890ff;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        margin-bottom: 6px;
        color: #666;
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
    border-radius: 8px;
    padding: 20px;
    width: 300px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideUp 0.3s ease;

    h4 {
      margin-top: 0;
      margin-bottom: 16px;
      color: #52c41a;
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
    padding: 12px;
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
</style>
