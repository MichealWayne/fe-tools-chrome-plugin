import { describe, expect, it } from 'vitest';
import { normalizeMooPayload } from '@/views/moo/moo-data-adapter';
import { searchMooIndex } from '@/views/moo/moo-search';

describe('MooCSS data adapter and search index', () => {
  const payload = {
    styles: {
      name: '样式模块词典',
      children: [
        {
          name: '基础样式',
          children: [
            {
              属性: 'display',
              说明: '布局方式',
              CSS版本: '3',
            },
          ],
        },
      ],
    },
    base: {
      name: 'moo-css-base词典',
      children: [
        {
          name: '颜色',
          children: [
            {
              变量: '--primary',
              十六进制色值: '#fff',
              说明: '主色',
              效果: '白色',
            },
          ],
        },
        {
          name: '方法',
          children: [
            {
              方法名: 'clamp',
              参数: 'min, val, max',
              说明: '限制范围',
              平台: '浏览器',
            },
          ],
        },
        {
          name: '样式',
          children: [
            {
              name: '基础类',
              children: [
                {
                  '类/属性名': 'u-hidden',
                  属性: 'display:none',
                  说明: '隐藏元素',
                },
              ],
            },
          ],
        },
      ],
    },
  };

  it('normalizes legacy MooCSS payload sections without changing field semantics', () => {
    expect(normalizeMooPayload(payload, 'zh')).toEqual({
      styleList: [{ type: '基础样式', name: 'display', desc: '布局方式', ver: '3' }],
      mooColorList: [{ name: '--primary #fff', desc: '主色', show: '白色' }],
      mooFuncList: [{ name: 'clamp(min, val, max)', desc: '限制范围', place: '浏览器' }],
      mooClassList: [{ type: '基础类', name: 'u-hidden', desc: '隐藏元素', val: 'display:none' }],
    });
  });

  it('prefers localized fields when the endpoint provides them', () => {
    const normalized = normalizeMooPayload(
      {
        styles: {
          name_zh: '样式模块词典',
          children: [
            {
              name_zh: '基础样式',
              children: [
                {
                  name_zh: 'display',
                  description_zh: '布局方式',
                  version_zh: '3',
                  name_en: 'display',
                  description_en: 'Layout mode',
                  version_en: '3',
                },
              ],
            },
          ],
        },
      },
      'en'
    );

    expect(normalized.styleList?.[0]).toEqual({
      type: '基础样式',
      name: 'display',
      desc: 'Layout mode',
      ver: '3',
    });
  });

  it('keeps MooCSS search ordering, highlighting, and localized links', () => {
    const index = normalizeMooPayload(payload, 'zh');
    const results = searchMooIndex({
      keywords: 'display',
      language: 'en',
      translate: key => ({ 'mooCss.variable': 'variable', 'mooCss.method': 'method' })[key] || key,
      styleList: index.styleList || [],
      mooColorList: index.mooColorList || [],
      mooFuncList: index.mooFuncList || [],
      mooClassList: index.mooClassList || [],
    });

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      label: 'CSS 3',
      color: 'orange',
      name: '<strong>display</strong>: <em s-ft_sub_>(基础样式)布局方式.</em>',
      link: 'https://developer.mozilla.org/en-US/docs/Web/CSS/display',
    });
  });

  it('does not search for one-character keywords', () => {
    expect(
      searchMooIndex({
        keywords: 'd',
        language: 'zh',
        translate: key => key,
        styleList: [],
        mooColorList: [],
        mooFuncList: [],
        mooClassList: [],
      })
    ).toEqual([]);
  });
});
