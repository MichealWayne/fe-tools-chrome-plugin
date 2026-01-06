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
          result.push({
            name: String(item.name),
            link: String(item.link),
            desc: String(item.desc || ''),
            target: Array.isArray(item.target)
              ? item.target.map(target => String(target))
              : undefined,
          });
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
        result.push({
          name: String(record.name),
          link: String(record.link),
          desc: String(record.desc || ''),
          target: Array.isArray(record.target)
            ? record.target.map(target => String(target))
            : undefined,
        });
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
}: BuildSearchResultsParams): SearchResultItem[] => {
  const normalizedKeywords = keywords.toLowerCase();

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

  if (normalizedKeywords?.length > 2) {
    const toolsData = feToolsList || [];

    toolsData.forEach(item => {
      const isSupportKeywords =
        item.name.includes(normalizedKeywords) ||
        item.desc?.includes(normalizedKeywords) ||
        (item.target && item.target.join(' | ').includes(normalizedKeywords));

      if (isSupportKeywords) {
        if (!item.link) {
          if (item.children?.length) {
            item.children.forEach(child => {
              resultList.push({
                label: 'tools',
                color: 'orange',
                link: child.link,
                name: `${child.name.replace(
                  normalizedKeywords,
                  `<strong>${normalizedKeywords}</strong>`
                )} <em>(${child.desc})</em>`,
              });
            });
          }
        } else {
          resultList.push({
            label: 'tools',
            color: 'orange',
            link: item.link,
            name: `${item.name.replace(
              normalizedKeywords,
              `<strong>${normalizedKeywords}</strong>`
            )} <em s-ft_sub_>(${item.desc})</em>`,
          });
        }
      }
    });
  }

  const bookmarks = markList || [];
  bookmarks.forEach(item => {
    if (item.title?.toLowerCase().includes(normalizedKeywords) && item.url) {
      resultList.push({
        link: item.url,
        name: item.title.replace(
          normalizedKeywords,
          `<strong>${normalizedKeywords}</strong>`
        ),
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
