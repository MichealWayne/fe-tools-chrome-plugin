import { beforeEach, describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { LanguageManager, langManager, messages, resolveInitialLanguage } from '@/utils/i18n';
import { syncDayjsLocale } from '@/components/DateConverter/useDateConverter';

describe('locale resolution', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prefers an explicit supported language', () => {
    expect(resolveInitialLanguage('zh', 'en-US')).toBe('zh');
    expect(resolveInitialLanguage('en', 'zh-CN')).toBe('en');
  });

  it('uses Chinese only for Chinese browser locales and English otherwise', () => {
    expect(resolveInitialLanguage(null, 'zh-CN')).toBe('zh');
    expect(resolveInitialLanguage(undefined, 'zh-TW')).toBe('zh');
    expect(resolveInitialLanguage(null, 'fr-FR')).toBe('en');
    expect(resolveInitialLanguage('unsupported', null)).toBe('en');
  });

  it('keeps the document language and date locale in sync', () => {
    const manager = new LanguageManager();

    manager.setLanguage('en');
    expect(document.documentElement.lang).toBe('en');
    syncDayjsLocale(manager.getCurrentLanguage());
    expect(dayjs.locale()).toBe('en');

    manager.setLanguage('zh');
    expect(document.documentElement.lang).toBe('zh');
    syncDayjsLocale(manager.getCurrentLanguage());
    expect(dayjs.locale()).toBe('zh-cn');
  });

  it('updates the shared manager without accepting unsupported values', () => {
    langManager.setLanguage('en');
    langManager.setLanguage('unsupported');
    expect(langManager.getCurrentLanguage()).toBe('en');
  });

  it('keeps Chinese and English message trees structurally aligned', () => {
    const walk = (left: unknown, right: unknown, path = ''): void => {
      expect(typeof right, path).toBe(typeof left);
      if (left && typeof left === 'object' && right && typeof right === 'object') {
        const leftKeys = Object.keys(left as object).sort();
        const rightKeys = Object.keys(right as object).sort();
        expect(rightKeys, path).toEqual(leftKeys);
        for (const key of leftKeys) {
          walk(
            (left as Record<string, unknown>)[key],
            (right as Record<string, unknown>)[key],
            path ? `${path}.${key}` : key
          );
        }
      }
    };

    walk(messages.zh, messages.en);
  });
});
