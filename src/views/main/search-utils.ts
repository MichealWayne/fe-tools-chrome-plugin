import { pinyin } from 'pinyin-pro';

import type { BookmarkItem, FeToolListItem, SearchResultItem } from './types';

type DefaultSearchItem = {
  name: string;
  link: string;
};

type Translate = (key: string, params?: Record<string, string | number>) => string;

type BuildSearchResultsParams = {
  keywords: string;
  feToolsList: FeToolListItem[];
  markList: BookmarkItem[];
  defaultSearchList: DefaultSearchItem[];
  translate: Translate;
  qrCodeType: string;
  enablePinyinSearch?: boolean;
};

const PINYIN_MATCH_MIN_LENGTH = 2;

/**
 * Normalize user input and searchable text for main search matching.
 * @param value - Raw value to normalize.
 */
export const normalizeSearchText = (value: string): string =>
  value.toLowerCase().trim().replace(/\s+/g, ' ');

const getPinyinInitials = (value: string): string =>
  pinyin(value, { type: 'all' })
    .map(item => item.first || item.origin)
    .join('');

/**
 * Build a pinyin-aware index for fields that can be searched.
 * @param values - Searchable source text values.
 */
export const buildPinyinSearchIndex = (values: Array<string | undefined>): string => {
  const source = values.filter(Boolean).join(' ');
  const normalizedSource = normalizeSearchText(source);
  const spacedPinyin = normalizeSearchText(pinyin(source, { toneSandhi: false, toneType: 'none' }));
  const compactPinyin = spacedPinyin.replace(/\s+/g, '');
  const initials = normalizeSearchText(getPinyinInitials(source));

  return [normalizedSource, spacedPinyin, compactPinyin, initials].filter(Boolean).join(' ');
};

const isLiteralMatch = (keywords: string, values: Array<string | undefined>): boolean =>
  values.some(value => normalizeSearchText(value || '').includes(keywords));

const isPinyinMatch = (keywords: string, searchIndex?: string): boolean => {
  if (keywords.length < PINYIN_MATCH_MIN_LENGTH) return false;
  return normalizeSearchText(searchIndex || '').includes(keywords.replace(/\s+/g, ' '));
};

const highlightLiteralMatch = (value: string, keywords: string): string => {
  const normalizedValue = normalizeSearchText(value);
  const matchIndex = normalizedValue.indexOf(keywords);
  if (matchIndex < 0) return value;

  return `${value.slice(0, matchIndex)}<strong>${value.slice(
    matchIndex,
    matchIndex + keywords.length
  )}</strong>${value.slice(matchIndex + keywords.length)}`;
};

const createToolItem = (item: Record<string, unknown>): FeToolListItem => {
  const target = Array.isArray(item.target) ? item.target.map(target => String(target)) : undefined;
  const desc = String(item.desc || '');
  const name = String(item.name);

  return {
    name,
    link: String(item.link),
    desc,
    target,
    pinyinSearchIndex: buildPinyinSearchIndex([name, desc, target?.join(' ')]),
  };
};

/**
 * Normalize tool list data from the remote API into a flat array.
 * @param list - Raw tools payload from the API.
 */
export const normalizeFeToolsList = (list: unknown): FeToolListItem[] => {
  const handleList = (data: unknown): FeToolListItem[] => {
    const result: FeToolListItem[] = [];
    if (Array.isArray(data)) {
      data.forEach((item: Record<string, unknown>) => {
        if (item.link && item.name) {
          result.push(createToolItem(item));
        }

        const children = item.children;
        if (Array.isArray(children) && children.length) {
          result.push(...handleList(children));
        }
      });
    }
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      if (record.link && record.name) {
        result.push(createToolItem(record));
      }
    }
    return result;
  };

  return handleList(list);
};

/**
 * Build aggregated search results for tools, bookmarks, and default providers.
 * @param params - Inputs needed to assemble the result list.
 */
export const buildSearchResults = ({
  keywords,
  feToolsList,
  markList,
  defaultSearchList,
  translate,
  qrCodeType,
  enablePinyinSearch = true,
}: BuildSearchResultsParams): SearchResultItem[] => {
  const normalizedKeywords = normalizeSearchText(keywords);

  if (normalizedKeywords.startsWith('http')) {
    return [
      {
        type: qrCodeType,
        link: '',
        name: translate('search.qrCodeResult'),
      },
    ];
  }

  const resultList: SearchResultItem[] = [];

  if (normalizedKeywords?.length >= PINYIN_MATCH_MIN_LENGTH) {
    const toolsData = feToolsList || [];

    toolsData.forEach(item => {
      const isSupportKeywords =
        isLiteralMatch(normalizedKeywords, [item.name, item.desc, item.target?.join(' ')]) ||
        (enablePinyinSearch && isPinyinMatch(normalizedKeywords, item.pinyinSearchIndex));

      if (isSupportKeywords) {
        if (!item.link) {
          if (item.children?.length) {
            item.children.forEach(child => {
              resultList.push({
                label: 'tools',
                color: 'orange',
                link: child.link,
                name: `${highlightLiteralMatch(child.name, normalizedKeywords)} <em>(${
                  child.desc
                })</em>`,
              });
            });
          }
        } else {
          resultList.push({
            label: 'tools',
            color: 'orange',
            link: item.link,
            name: `${highlightLiteralMatch(item.name, normalizedKeywords)} <em s-ft_sub_>(${
              item.desc
            })</em>`,
          });
        }
      }
    });
  }

  const bookmarks = markList || [];
  bookmarks.forEach(item => {
    const title = item.title || '';
    const isBookmarkMatch =
      isLiteralMatch(normalizedKeywords, [title]) ||
      (enablePinyinSearch && isPinyinMatch(normalizedKeywords, buildPinyinSearchIndex([title])));

    if (isBookmarkMatch && item.url) {
      resultList.push({
        link: item.url,
        name: highlightLiteralMatch(title, normalizedKeywords),
        color: 'red',
        label: 'mark',
      });
    }
  });

  defaultSearchList.forEach(item => {
    resultList.push({
      link: item.link + normalizedKeywords,
      name: translate('search.searchIn', { site: item.name, keywords: normalizedKeywords }),
    });
  });

  return resultList;
};
