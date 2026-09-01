import type { SupportedLanguage } from './i18n';

type ReferenceRecord = Record<string, unknown>;

const LEGACY_FIELD_NAMES: Record<string, string[]> = {
  name: ['名称', '属性', '变量', '方法名', '类/属性名'],
  description: ['说明'],
  version: ['CSS版本'],
  value: ['属性'],
  display: ['效果'],
  parameter: ['参数'],
  platform: ['平台'],
  hex: ['十六进制色值'],
};

const asRecord = (value: unknown): ReferenceRecord | null =>
  value && typeof value === 'object' ? (value as ReferenceRecord) : null;

export const getReferenceField = (
  record: ReferenceRecord,
  field: string,
  language: SupportedLanguage
): string => {
  for (const key of [`${field}_${language}`, `${field}-${language}`]) {
    if (typeof record[key] === 'string') return record[key] as string;
  }
  const languageRecord = asRecord(record[language]);
  if (languageRecord && typeof languageRecord[field] === 'string') {
    return languageRecord[field] as string;
  }
  if (typeof record[field] === 'string') return record[field] as string;
  for (const key of LEGACY_FIELD_NAMES[field] || []) {
    if (typeof record[key] === 'string') return record[key] as string;
  }
  return '';
};

export const getReferenceLanguage = (language: string): SupportedLanguage =>
  language === 'zh' ? 'zh' : 'en';

export const getReferenceSection = (record: ReferenceRecord): string => {
  const name = getReferenceField(record, 'name', 'zh');
  if (name === '样式模块词典' || name === 'Style module dictionary') return 'styles';
  if (name === 'moo-css-base词典' || name === 'Moo CSS base dictionary') return 'base';
  if (name === '颜色' || name === 'Colors') return 'colors';
  if (name === '方法' || name === 'Functions') return 'functions';
  if (name === '样式' || name === 'Styles') return 'classes';
  return '';
};
