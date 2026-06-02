import { beforeEach, describe, expect, it } from 'vitest';
import {
  getPinyinSearchPreference,
  PINYIN_SEARCH_STORAGE_KEY,
  setPinyinSearchPreference,
} from '@/views/main/preferences';

describe('main preferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults pinyin search to enabled when no preference is saved', () => {
    expect(getPinyinSearchPreference()).toBe(true);
  });

  it('persists disabled pinyin search preference', () => {
    setPinyinSearchPreference(false);

    expect(localStorage.getItem(PINYIN_SEARCH_STORAGE_KEY)).toBe('false');
    expect(getPinyinSearchPreference()).toBe(false);
  });

  it('persists enabled pinyin search preference', () => {
    setPinyinSearchPreference(true);

    expect(localStorage.getItem(PINYIN_SEARCH_STORAGE_KEY)).toBe('true');
    expect(getPinyinSearchPreference()).toBe(true);
  });
});
