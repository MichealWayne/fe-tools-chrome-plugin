import { ref, type Ref } from 'vue';

/**
 * Static i18n message bundles keyed by language code.
 */
import enMessages from './i18n/messages/en';
import zhMessages from './i18n/messages/zh';

export const messages = {
  zh: zhMessages,
  en: enMessages,
};

export type SupportedLanguage = keyof typeof messages;

const isSupportedLanguage = (lang: string | null | undefined): lang is SupportedLanguage =>
  lang === 'zh' || lang === 'en';

/**
 * Resolve the initial application language from an explicit preference first,
 * then the browser locale. English is the safe fallback for non-Chinese users.
 */
export const resolveInitialLanguage = (
  storedLanguage?: string | null,
  browserLanguage?: string | null
): SupportedLanguage => {
  if (isSupportedLanguage(storedLanguage)) return storedLanguage;
  const locale = (browserLanguage || '').toLowerCase();
  return locale.startsWith('zh') ? 'zh' : 'en';
};

/**
 * Language manager that persists user preference and notifies subscribers.
 */
export class LanguageManager {
  private currentLang: SupportedLanguage;
  private currentLangRef: Ref<SupportedLanguage>;
  private listeners: Array<(lang: string) => void> = [];

  constructor() {
    this.currentLang = resolveInitialLanguage(
      this.getStoredLanguage(),
      typeof navigator !== 'undefined' ? navigator.language : null
    );
    this.currentLangRef = ref(this.currentLang);
    this.syncDocumentLanguage();
  }

  /**
   * Read the persisted language code from localStorage.
   */
  getStoredLanguage(): string | null {
    return localStorage.getItem('fe-tools-language');
  }

  /**
   * Update language state, persist it, and notify listeners.
   * @param lang - Language code to activate.
   */
  setLanguage(lang: string): void {
    if (isSupportedLanguage(lang)) {
      this.currentLang = lang;
      this.currentLangRef.value = lang;
      localStorage.setItem('fe-tools-language', lang);
      this.syncDocumentLanguage();
      this.notifyListeners();
    }
  }

  /**
   * Get the currently active language code.
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLangRef.value;
  }

  /**
   * Expose the reactive language ref to locale-dependent integrations.
   */
  get languageRef(): Readonly<Ref<SupportedLanguage>> {
    return this.currentLangRef;
  }

  /**
   * Resolve a translated string by dot-path key.
   * @param key - Dot-separated message key.
   * @param params - Template parameters for message interpolation.
   */
  t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    const currentLang = this.currentLangRef.value;
    let value: unknown = messages[currentLang];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        /**
         * Fallback to the original key when a translation is missing.
         */
        return key;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    if (!params) {
      return value || key;
    }

    return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
  }

  /**
   * Subscribe to language changes.
   * @param callback - Listener invoked when language changes.
   */
  addListener(callback: (lang: string) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Unsubscribe from language changes.
   * @param callback - Listener to remove.
   */
  removeListener(callback: (lang: string) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all subscribers of the active language.
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.currentLang));
  }

  private syncDocumentLanguage(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = this.currentLang;
    }
  }
}

/**
 * Singleton language manager shared by the app.
 */
export const langManager = new LanguageManager();
