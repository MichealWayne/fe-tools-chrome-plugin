import { describe, expect, it } from 'vitest';
import { getReferenceField } from '@/utils/reference-data';

describe('reference-data adapter', () => {
  it('prefers localized neutral fields', () => {
    expect(
      getReferenceField(
        { name: 'Fallback', name_en: 'English name', name_zh: '中文名称' },
        'name',
        'en'
      )
    ).toBe('English name');
  });

  it('supports nested language fields and legacy Chinese fields', () => {
    expect(
      getReferenceField({ en: { description: 'English description' } }, 'description', 'en')
    ).toBe('English description');
    expect(getReferenceField({ 说明: '旧字段说明' }, 'description', 'en')).toBe('旧字段说明');
  });
});
