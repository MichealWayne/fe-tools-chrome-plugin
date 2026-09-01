import type {
  MooClassItem,
  MooColorItem,
  MooFuncItem,
  MooSearchResult,
  MooStyleItem,
} from './types';

type Translate = (key: string, params?: Record<string, string | number>) => string;

type SearchMooIndexParams = {
  keywords: string;
  language: string;
  translate: Translate;
  styleList: MooStyleItem[];
  mooColorList: MooColorItem[];
  mooFuncList: MooFuncItem[];
  mooClassList: MooClassItem[];
};

const highlight = (value: string, keywords: string): string =>
  value.replace(keywords, '<strong>' + keywords + '</strong>');

export const searchMooIndex = ({
  keywords: rawKeywords,
  language,
  translate,
  styleList,
  mooColorList,
  mooFuncList,
  mooClassList,
}: SearchMooIndexParams): MooSearchResult[] => {
  const keywords = rawKeywords.toLowerCase();
  const resultList: MooSearchResult[] = [];
  if (keywords.length <= 1) return resultList;

  styleList.forEach(item => {
    if (
      item.name.includes(keywords) ||
      item.desc.includes(keywords) ||
      item.type.includes(keywords)
    ) {
      resultList.push({
        label: 'CSS ' + item.ver,
        color: 'orange',
        name:
          highlight(item.name, keywords) +
          ': <em s-ft_sub_>(' +
          item.type +
          ')' +
          item.desc +
          '.</em>',
        link:
          'https://developer.mozilla.org/' +
          (language === 'en' ? 'en-US' : 'zh-CN') +
          '/docs/Web/CSS/' +
          item.name.toLowerCase().replace(/\s/g, ''),
      });
    }
  });

  mooColorList.forEach(item => {
    if (item.name.includes(keywords) || item.desc.includes(keywords)) {
      resultList.unshift({
        label: 'moo',
        color: 'red',
        name:
          item.show +
          ' (' +
          translate('mooCss.variable') +
          ')' +
          highlight(item.name, keywords) +
          ': <em s-ft_sub_>' +
          item.desc +
          '</em>',
        link: 'https://blog.michealwayne.cn/Moo-CSS/docs/nameDictionary/#%E9%A2%9C%E8%89%B2',
      });
    }
  });

  mooFuncList.forEach(item => {
    if (item.name.includes(keywords) || item.desc.includes(keywords)) {
      resultList.unshift({
        label: 'moo-f',
        color: 'blue',
        name:
          '(' +
          translate('mooCss.method') +
          ')' +
          highlight(item.name, keywords) +
          ': <em s-ft_sub_>' +
          item.place +
          ', ' +
          item.desc +
          '</em>',
        link: 'https://blog.michealwayne.cn/Moo-CSS/docs/nameDictionary/#%E6%96%B9%E6%B3%95',
      });
    }
  });

  mooClassList.forEach(item => {
    if (
      item.name.includes(keywords) ||
      item.desc.includes(keywords) ||
      item.val.includes(keywords)
    ) {
      resultList.push({
        label: 'moo',
        color: 'red',
        name:
          highlight(item.name, keywords) +
          ': <em s-ft_sub_>' +
          item.desc +
          '.(' +
          item.val +
          ')</em>',
        link: 'https://blog.michealwayne.cn/Moo-CSS/docs/nameDictionary/#%E6%A0%B7%E5%BC%8F',
      });
    }
  });

  return resultList;
};
