import { buildSearchResults } from './search-utils';

/**
 * Search state helpers used by the main view. Keeping index movement here
 * makes keyboard behavior independently testable without mounting Vue.
 */
export const getNextResultIndex = (
  currentIndex: number,
  resultCount: number,
  direction: 1 | -1
): number => {
  if (resultCount <= 0) return -1;
  return (currentIndex + direction + resultCount) % resultCount;
};

export const useToolSearch = () => ({
  buildResults: buildSearchResults,
  getNextResultIndex,
  resetSelection: (): number => -1,
});
