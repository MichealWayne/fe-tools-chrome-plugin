/**
 * @author Wayne
 * @Date 2019-10-08 13:54:41
 * @LastEditTime 2023-07-25 19:34:58
 */

export const IS_DEV = import.meta.env.MODE === 'development';

export const API_HOST = import.meta.env.VITE_API_HOST;

export const AJAX_INTERFACE = {
  getFeTools: `get ${API_HOST}fe-tools/datas/tools.json`,
  handleTranslate: `get ${IS_DEV ? '' : 'https://fanyi.youdao.com'}/translate`,
  getMooCSS: `get ${API_HOST}fe-tools/datas/moo-css.json`,
  getRegex: `get ${API_HOST}fe-tools/datas/regex.json`,
  getUtilFuncs: `get ${API_HOST}fe-tools/stable/data/yafReflectionMap.json`,
};

// 默认搜索
export const DEFAULT_SEARCH_LIST = [
  { name: 'mdn', link: 'https://developer.mozilla.org/zh-CN/search?q=' },
  { name: 'github', link: 'https://github.com/search?q=' },
  { name: 'npmjs', link: 'https://www.npmjs.com/search?q=' },
  { name: 'caniuse', link: 'https://caniuse.com/#search=' },
  { name: 'stackoverflow', link: 'https://stackoverflow.com/search?q=' },
  { name: 'google', link: 'https://www.google.com/search?q=' },
  { name: 'baidu', link: 'https://www.baidu.com/s?ie=UTF-8&wd=' },
];
