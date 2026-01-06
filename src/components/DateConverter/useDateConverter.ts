import { ref, computed, onMounted } from 'vue';
import DOMPurify from 'dompurify';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

const setupDayjs = (() => {
  let initialized = false;
  return () => {
    if (initialized) return;
    dayjs.extend(utc);
    dayjs.extend(timezone);
    dayjs.extend(relativeTime);
    dayjs.locale('zh-cn');
    initialized = true;
  };
})();

export const useDateConverter = (
  t: (key: string, params?: Record<string, string | number>) => string
) => {
  setupDayjs();

  const inputType = ref('timestamp');
  const inputTimestamp = ref<number | null>(null);
  const inputIso = ref('');
  const inputLocalString = ref('');
  const inputCustom = ref('');
  const customFormat = ref('YYYY-MM-DD HH:mm:ss');
  const timestampUnit = ref('seconds');
  const selectedTimezone = ref('Asia/Shanghai');
  const error = ref('');
  const currentDate = ref<dayjs.Dayjs | null>(null);
  const successVisible = ref(false);
  const successMessage = ref('');

  const calculationValue = ref<number | null>(1);
  const calculationUnit = ref('days');
  const calculationResult = ref('');

  const timezones = computed(() => [
    { value: 'Asia/Shanghai', label: t('dateConverter.timezones.asiaShanghai') },
    { value: 'Asia/Tokyo', label: t('dateConverter.timezones.asiaTokyo') },
    { value: 'Europe/London', label: t('dateConverter.timezones.europeLondon') },
    { value: 'Europe/Paris', label: t('dateConverter.timezones.europeParis') },
    { value: 'America/New_York', label: t('dateConverter.timezones.americaNewYork') },
    { value: 'America/Los_Angeles', label: t('dateConverter.timezones.americaLosAngeles') },
    { value: 'UTC', label: t('dateConverter.timezones.utc') },
  ]);

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

  onMounted(() => {
    useCurrentTime();
  });

  const useCurrentTime = () => {
    error.value = '';
    currentDate.value = dayjs();

    inputTimestamp.value = Math.floor(currentDate.value.valueOf() / 1000);
    inputIso.value = currentDate.value.toISOString();
    inputLocalString.value = currentDate.value.format('YYYY-MM-DDTHH:mm');
    inputCustom.value = currentDate.value.format(customFormat.value);
  };

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

      inputIso.value = currentDate.value.toISOString();
      inputLocalString.value = currentDate.value.format('YYYY-MM-DDTHH:mm');
      inputCustom.value = currentDate.value.format(customFormat.value);
    } catch (e) {
      error.value = t('dateConverter.messages.convertFailed', { message: (e as Error).message });
      currentDate.value = null;
    }
  };

  const convertFromIso = () => {
    error.value = '';
    if (!inputIso.value) {
      currentDate.value = null;
      return;
    }

    try {
      const sanitizedInput = DOMPurify.sanitize(inputIso.value);
      currentDate.value = dayjs(sanitizedInput);

      if (!currentDate.value.isValid()) {
        throw new Error(t('dateConverter.messages.invalidIso'));
      }

      inputTimestamp.value = Math.floor(currentDate.value.valueOf() / 1000);
      inputLocalString.value = currentDate.value.format('YYYY-MM-DDTHH:mm');
      inputCustom.value = currentDate.value.format(customFormat.value);
    } catch (e) {
      error.value = t('dateConverter.messages.convertFailed', { message: (e as Error).message });
      currentDate.value = null;
    }
  };

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

      inputTimestamp.value = Math.floor(currentDate.value.valueOf() / 1000);
      inputIso.value = currentDate.value.toISOString();
      inputCustom.value = currentDate.value.format(customFormat.value);
    } catch (e) {
      error.value = t('dateConverter.messages.convertFailed', { message: (e as Error).message });
      currentDate.value = null;
    }
  };

  const convertFromCustom = () => {
    error.value = '';
    if (!inputCustom.value || !customFormat.value) {
      currentDate.value = null;
      return;
    }

    try {
      const sanitizedInput = DOMPurify.sanitize(inputCustom.value);
      const sanitizedFormat = DOMPurify.sanitize(customFormat.value);

      currentDate.value = dayjs(sanitizedInput, sanitizedFormat);

      if (!currentDate.value.isValid()) {
        throw new Error(t('dateConverter.messages.invalidDate'));
      }

      inputTimestamp.value = Math.floor(currentDate.value.valueOf() / 1000);
      inputIso.value = currentDate.value.toISOString();
      inputLocalString.value = currentDate.value.format('YYYY-MM-DDTHH:mm');
    } catch (e) {
      error.value = t('dateConverter.messages.convertFailed', { message: (e as Error).message });
      currentDate.value = null;
    }
  };

  const updateAllOutputs = () => {
    if (!currentDate.value) return;
  };

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

  const showSuccess = (message: string) => {
    successMessage.value = message;
    successVisible.value = true;
    setTimeout(() => {
      successVisible.value = false;
    }, 2000);
  };

  return {
    inputType,
    inputTimestamp,
    inputIso,
    inputLocalString,
    inputCustom,
    customFormat,
    timestampUnit,
    selectedTimezone,
    error,
    currentDate,
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
  };
};
