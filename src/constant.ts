/**
 * @author Wayne
 * @Date 2019-10-08 13:54:41
 * @LastEditTime 2025-09-08 09:51:41
 */

/**
 * Whether the extension is running in a local development environment.
 */
export const IS_DEV = import.meta.env.MODE === 'development';

/**
 * Base host for API requests configured via Vite env.
 */
export const API_HOST = import.meta.env.VITE_API_HOST;

/**
 * API endpoint map for remote data sources used by the tools.
 */
export const AJAX_INTERFACE = {
  getFeTools: `get ${API_HOST}fe-tools/datas/tools.json`,
  /**
   * Legacy endpoint example for Youdao translation (kept for reference).
   * Example: `get ${IS_DEV ? '' : 'https://fanyi.youdao.com'}/translate`
   */
  handleTranslate: `get ${IS_DEV ? '/translate' : 'https://translate.appworlds.cn'}`,
  getMooCSS: `get ${API_HOST}fe-tools/datas/moo-css.json`,
  getRegex: `get ${API_HOST}fe-tools/datas/regex.json`,
  getUtilFuncs: `get ${API_HOST}fe-tools/stable/data/yafReflectionMap.json`,
  getLinuxCommands: `get ${API_HOST}fe-tools/datas/linux-commands.json`,
};

/**
 * Default search providers used by the main search bar.
 */
export const DEFAULT_SEARCH_LIST = [
  { name: 'mdn', link: 'https://developer.mozilla.org/zh-CN/search?q=' },
  { name: 'github', link: 'https://github.com/search?q=' },
  { name: 'npmjs', link: 'https://www.npmjs.com/search?q=' },
  { name: 'caniuse', link: 'https://caniuse.com/#search=' },
  { name: 'stackoverflow', link: 'https://stackoverflow.com/search?q=' },
  { name: 'google', link: 'https://www.google.com/search?q=' },
  { name: 'baidu', link: 'https://www.baidu.com/s?ie=UTF-8&wd=' },
];
