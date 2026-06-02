export const PINYIN_SEARCH_STORAGE_KEY = 'feTools_enablePinyinSearch';

/**
 * Read whether pinyin-derived search matches are enabled.
 */
export const getPinyinSearchPreference = (): boolean =>
  localStorage.getItem(PINYIN_SEARCH_STORAGE_KEY) !== 'false';

/**
 * Persist whether pinyin-derived search matches are enabled.
 * @param enabled - Current pinyin search selection.
 */
export const setPinyinSearchPreference = (enabled: boolean): void => {
  localStorage.setItem(PINYIN_SEARCH_STORAGE_KEY, String(enabled));
};
