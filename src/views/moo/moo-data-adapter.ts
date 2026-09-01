import {
  getReferenceField,
  getReferenceLanguage,
  getReferenceSection,
} from '@/utils/reference-data';
import type {
  MooClassItem,
  MooColorItem,
  MooFuncItem,
  MooSearchIndex,
  MooStyleItem,
} from './types';

type ReferenceRecord = Record<string, unknown>;

const asRecords = (value: unknown): ReferenceRecord[] =>
  Array.isArray(value)
    ? (value.filter(item => item && typeof item === 'object') as ReferenceRecord[])
    : [];

const field = (record: ReferenceRecord, name: string, language: string): string =>
  getReferenceField(record, name, getReferenceLanguage(language));

const localizedField = (record: ReferenceRecord, name: string, language: string): string =>
  field(record, name, language) ||
  (language === 'en' ? field(record, name, 'zh') : field(record, name, 'en'));

const className = (record: ReferenceRecord, language: string): string => {
  const localizedLanguage = getReferenceLanguage(language);
  const localizedRecord = record[localizedLanguage];
  const localizedName = [
    record[`name_${localizedLanguage}`],
    record[`name-${localizedLanguage}`],
    localizedRecord && typeof localizedRecord === 'object'
      ? (localizedRecord as ReferenceRecord).name
      : undefined,
    record.name,
    record[`name_${localizedLanguage === 'en' ? 'zh' : 'en'}`],
  ].find(value => typeof value === 'string');
  return (
    (localizedName as string | undefined) ||
    (typeof record['类/属性名'] === 'string' ? record['类/属性名'] : '')
  );
};

export const normalizeStyleList = (list: ReferenceRecord[], language: string): MooStyleItem[] => {
  const result: MooStyleItem[] = [];
  Object.values(list).forEach(item => {
    const name = localizedField(item, 'name', language);
    asRecords(item.children).forEach(child => {
      result.push({
        type: name,
        name: field(child, 'name', language),
        desc: field(child, 'description', language),
        ver: field(child, 'version', language),
      });
    });
  });
  return result;
};

export const normalizeMooColorList = (list: ReferenceRecord[], language: string): MooColorItem[] =>
  list.map(item => ({
    name: (field(item, 'name', language) + ' ' + field(item, 'hex', language)).trim(),
    desc: field(item, 'description', language),
    show: field(item, 'display', language),
  }));

export const normalizeMooFuncList = (list: ReferenceRecord[], language: string): MooFuncItem[] =>
  list.map(item => ({
    name: field(item, 'name', language) + '(' + field(item, 'parameter', language) + ')',
    desc: field(item, 'description', language),
    place: field(item, 'platform', language),
  }));

export const normalizeMooClassList = (
  list: ReferenceRecord[],
  language: string
): MooClassItem[] => {
  const result: MooClassItem[] = [];
  Object.values(list).forEach(item => {
    const name = localizedField(item, 'name', language);
    asRecords(item.children).forEach(child => {
      const childName = className(child, language);
      const value = field(child, 'value', language);
      if (!childName || !value) return;
      result.push({
        type: name,
        name: childName,
        desc: field(child, 'description', language),
        val: value,
      });
    });
  });
  return result;
};

export const normalizeMooPayload = (data: unknown, language: string): Partial<MooSearchIndex> => {
  if (!data || typeof data !== 'object') return {};
  const result: Partial<MooSearchIndex> = {};
  Object.values(data as Record<string, unknown>).forEach(item => {
    if (!item || typeof item !== 'object') return;
    const record = item as ReferenceRecord;
    const children = asRecords(record.children);
    const section = getReferenceSection(record);
    if (section === 'styles') {
      result.styleList = normalizeStyleList(children, language);
      return;
    }
    if (section !== 'base') return;
    children.forEach(subItem => {
      const subSection = getReferenceSection(subItem);
      const subChildren = asRecords(subItem.children);
      if (subSection === 'colors')
        result.mooColorList = normalizeMooColorList(subChildren, language);
      if (subSection === 'functions')
        result.mooFuncList = normalizeMooFuncList(subChildren, language);
      if (subSection === 'classes')
        result.mooClassList = normalizeMooClassList(subChildren, language);
    });
  });
  return result;
};
