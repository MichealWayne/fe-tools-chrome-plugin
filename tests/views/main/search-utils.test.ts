import { describe, expect, it } from 'vitest';
import { buildSearchResults, normalizeFeToolsList } from '@/views/main/search-utils';
import type { BookmarkItem, FeToolListItem } from '@/views/main/types';

describe('search-utils', () => {
  const translate = (key: string, params?: Record<string, string | number>) => {
    if (key === 'search.qrCodeResult') return 'QR code';
    if (key === 'search.searchIn') {
      return `Search ${params?.site} for ${params?.keywords}`;
    }
    return key;
  };

  it('normalizes tools list with nested items', () => {
    const input = [
      {
        name: 'Parent',
        link: '',
        desc: 'root',
        children: [{ name: 'Child', link: 'https://child', desc: 'child' }],
      },
    ];
    const result = normalizeFeToolsList(input);
    expect(result).toEqual([
      {
        name: 'Child',
        link: 'https://child',
        desc: 'child',
        target: undefined,
      },
    ]);
  });

  it('returns QR code result for URL keywords', () => {
    const results = buildSearchResults({
      keywords: 'https://example.com',
      feToolsList: [],
      markList: [],
      defaultSearchList: [],
      translate,
      qrCodeType: 'qr',
    });

    expect(results).toEqual([
      {
        type: 'qr',
        link: '',
        name: 'QR code',
      },
    ]);
  });

  it('builds results for tools, bookmarks, and defaults', () => {
    const feToolsList: FeToolListItem[] = [
      {
        name: 'json tool',
        link: 'https://tools/json',
        desc: 'format json',
      },
    ];
    const markList: BookmarkItem[] = [
      {
        title: 'json docs',
        url: 'https://docs/json',
      },
    ];

    const results = buildSearchResults({
      keywords: 'json',
      feToolsList,
      markList,
      defaultSearchList: [{ name: 'Google', link: 'https://google.com?q=' }],
      translate,
      qrCodeType: 'qr',
    });

    expect(results[0].label).toBe('tools');
    expect(results[1].label).toBe('mark');
    expect(results[2].name).toBe('Search Google for json');
  });
});
