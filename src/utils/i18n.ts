import { ref } from 'vue';

/**
 * Static i18n message bundles keyed by language code.
 */
import enMessages from './i18n/messages/en';
import zhMessages from './i18n/messages/zh';

export const messages = {
  zh: zhMessages,
  en: enMessages,
};

/**
 * Language manager that persists user preference and notifies subscribers.
 */
export class LanguageManager {
  private currentLang: string;
  private currentLangRef;
  private listeners: Array<(lang: string) => void> = [];

  constructor() {
    this.currentLang = this.getStoredLanguage() || 'zh';
    this.currentLangRef = ref(this.currentLang);
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
    if (messages[lang as keyof typeof messages]) {
      this.currentLang = lang;
      this.currentLangRef.value = lang;
      localStorage.setItem('fe-tools-language', lang);
      this.notifyListeners();
    }
  }

  /**
   * Get the currently active language code.
   */
  getCurrentLanguage(): string {
    return this.currentLangRef.value;
  }

  /**
   * Resolve a translated string by dot-path key.
   * @param key - Dot-separated message key.
   * @param params - Template parameters for message interpolation.
   */
  t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    const currentLang = this.currentLangRef.value;
    let value: any = messages[currentLang as keyof typeof messages];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
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
}

/**
 * Singleton language manager shared by the app.
 */
export const langManager = new LanguageManager();
