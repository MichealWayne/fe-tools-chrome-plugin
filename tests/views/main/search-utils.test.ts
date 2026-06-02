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
    expect(result[0]).toMatchObject({
      name: 'Child',
      link: 'https://child',
      desc: 'child',
      target: undefined,
    });
    expect(result[0].pinyinSearchIndex).toContain('child');
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

  it('matches Chinese tools by full pinyin, compact pinyin, and initials', () => {
    const feToolsList = normalizeFeToolsList([
      {
        name: '颜色变量',
        link: 'https://tools/color',
        desc: '颜色格式转换',
        target: ['样式'],
      },
    ]);

    const createResults = (keywords: string) =>
      buildSearchResults({
        keywords,
        feToolsList,
        markList: [],
        defaultSearchList: [],
        translate,
        qrCodeType: 'qr',
        enablePinyinSearch: true,
      });

    expect(createResults('yan se')[0].link).toBe('https://tools/color');
    expect(createResults('yanse')[0].link).toBe('https://tools/color');
    expect(createResults('ys')[0].link).toBe('https://tools/color');
  });

  it('matches Chinese bookmarks by pinyin when enabled', () => {
    const results = buildSearchResults({
      keywords: 'yanse',
      feToolsList: [],
      markList: [{ title: '颜色文档', url: 'https://docs/color' }],
      defaultSearchList: [],
      translate,
      qrCodeType: 'qr',
      enablePinyinSearch: true,
    });

    expect(results[0]).toMatchObject({
      link: 'https://docs/color',
      label: 'mark',
    });
  });

  it('excludes pinyin-only matches when pinyin search is disabled', () => {
    const feToolsList = normalizeFeToolsList([
      {
        name: '颜色变量',
        link: 'https://tools/color',
        desc: '颜色格式转换',
      },
    ]);

    const results = buildSearchResults({
      keywords: 'yanse',
      feToolsList,
      markList: [{ title: '颜色文档', url: 'https://docs/color' }],
      defaultSearchList: [],
      translate,
      qrCodeType: 'qr',
      enablePinyinSearch: false,
    });

    expect(results).toEqual([]);
  });

  it('keeps literal search active when pinyin search is disabled', () => {
    const feToolsList: FeToolListItem[] = [
      {
        name: '颜色变量',
        link: 'https://tools/color',
        desc: '颜色格式转换',
      },
    ];

    const results = buildSearchResults({
      keywords: '颜色',
      feToolsList,
      markList: [{ title: '颜色文档', url: 'https://docs/color' }],
      defaultSearchList: [],
      translate,
      qrCodeType: 'qr',
      enablePinyinSearch: false,
    });

    expect(results[0].label).toBe('tools');
    expect(results[1].label).toBe('mark');
  });
});
