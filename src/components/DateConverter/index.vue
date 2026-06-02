<template>
  <section class="date-converter" @click="stopPropagation">
    <div class="date-converter__header">
      <div class="date-converter__header-content">
        <h4 class="date-converter__title">
          {{ t('dateConverter.title') }}
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
              <input v-model="inputType" type="radio" value="timestamp" />
              <span>{{ t('dateConverter.inputTypes.timestamp') }}</span>
            </label>
            <label class="date-converter__radio">
              <input v-model="inputType" type="radio" value="iso" />
              <span>{{ t('dateConverter.inputTypes.iso') }}</span>
            </label>
            <label class="date-converter__radio">
              <input v-model="inputType" type="radio" value="local" />
              <span>{{ t('dateConverter.inputTypes.local') }}</span>
            </label>
            <label class="date-converter__radio">
              <input v-model="inputType" type="radio" value="custom" />
              <span>{{ t('dateConverter.inputTypes.custom') }}</span>
            </label>
          </div>

          <div class="date-converter__input-container">
            <template v-if="inputType === 'timestamp'">
              <input
                v-model.number="inputTimestamp"
                type="number"
                class="date-converter__input"
                :placeholder="t('dateConverter.placeholders.timestampSeconds')"
                @input="convertFromTimestamp"
              />
              <div class="date-converter__unit-selector">
                <label class="date-converter__radio">
                  <input
                    v-model="timestampUnit"
                    type="radio"
                    value="seconds"
                    @change="convertFromTimestamp"
                  />
                  <span>{{ t('dateConverter.units.seconds') }}</span>
                </label>
                <label class="date-converter__radio">
                  <input
                    v-model="timestampUnit"
                    type="radio"
                    value="milliseconds"
                    @change="convertFromTimestamp"
                  />
                  <span>{{ t('dateConverter.units.milliseconds') }}</span>
                </label>
              </div>
            </template>

            <template v-else-if="inputType === 'iso'">
              <input
                v-model="inputIso"
                type="text"
                class="date-converter__input"
                :placeholder="t('dateConverter.placeholders.iso')"
                @input="convertFromIso"
              />
            </template>

            <template v-else-if="inputType === 'local'">
              <input
                v-model="inputLocalString"
                type="datetime-local"
                class="date-converter__input"
                @input="convertFromLocalString"
              />
            </template>

            <template v-else-if="inputType === 'custom'">
              <div class="date-converter__custom-container">
                <input
                  v-model="inputCustom"
                  type="text"
                  class="date-converter__input"
                  :placeholder="t('dateConverter.placeholders.customInput')"
                  @input="convertFromCustom"
                />
                <input
                  v-model="customFormat"
                  type="text"
                  class="date-converter__format-input"
                  :placeholder="t('dateConverter.placeholders.customFormat')"
                  @input="convertFromCustom"
                />
              </div>
            </template>
          </div>
        </div>

        <div v-if="error" class="date-converter__error">
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
              :class="{ 'date-converter__btn-disabled': !hasValidDate }"
              @click="copyToClipboard"
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
            <div class="date-converter__result-label">
              {{ t('dateConverter.resultLabels.iso') }}
            </div>
            <div class="date-converter__result-value">{{ outputIso }}</div>
          </div>

          <div class="date-converter__result-item">
            <div class="date-converter__result-label">
              {{ t('dateConverter.resultLabels.local') }}
            </div>
            <div class="date-converter__result-value">{{ outputLocal }}</div>
          </div>

          <div class="date-converter__result-item">
            <div class="date-converter__result-label">
              {{ t('dateConverter.resultLabels.utc') }}
            </div>
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
            v-model.number="calculationValue"
            type="number"
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

        <div v-if="calculationResult" class="date-converter__calculator-result">
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
import { langManager } from '@/utils/i18n';
import { useDateConverter } from './useDateConverter';

const t = (key: string, params?: Record<string, string | number>) => langManager.t(key, params);

defineOptions({
  name: 'DateConverter',
});

defineProps<{
  back?: () => void;
}>();

const {
  inputType,
  inputTimestamp,
  inputIso,
  inputLocalString,
  inputCustom,
  customFormat,
  timestampUnit,
  selectedTimezone,
  error,
  successVisible,
  successMessage,
  calculationValue,
  calculationUnit,
  calculationResult,
  timezones,
  hasValidDate,
  outputTimestampSeconds,
  outputTimestampMilliseconds,
  outputIso,
  outputLocal,
  outputUtc,
  outputRelative,
  useCurrentTime,
  convertFromTimestamp,
  convertFromIso,
  convertFromLocalString,
  convertFromCustom,
  updateAllOutputs,
  calculateDate,
  copyToClipboard,
} = useDateConverter(t);

const stopPropagation = (e: Event) => {
  e.stopPropagation();
};
</script>

<style lang="less" scoped src="./date-converter.less"></style>
