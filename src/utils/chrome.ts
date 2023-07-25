/**
 * @author Wayne
 * @Date 2019-10-02 14:48:29
 * @LastEditTime 2023-07-24 14:31:28
 */

import { AnyFunc, AnyObj } from '@/types';
import { IS_DEV } from '@/constant';

/**
 * @function function
 * @description 跳转页面
 * @param {string} url
 */
export function jumpAction(url: string) {
  if (!url) return;
  try {
    chrome.tabs.create({
      url,
    });
  } catch (e) {
    if (IS_DEV) console.error('jumpAction', e);
    window.open(url);
  }
}

/**
 * @function getLocalTabUrl
 * @description 获得当前窗口url
 * @param {function} cb
 */
export function getLocalTabUrl(cb: (url: string, tab?: any) => any) {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
      const tab = tabs[0];
      if (cb) cb(tab.url, tab);
    });
  } catch (e) {
    if (IS_DEV) console.error('getLocalTabUrl', e);
    cb(location.href);
  }
}

/**
 * @function getMarkTree
 * @description 获取书签
 * @param {function} cb
 */
export function getMarkTree(cb: AnyFunc) {
  const result: AnyObj[] = [];

  function clearUpFavorite(data: any[]) {
    let i = data.length - 1;
    while (i >= 0) {
      const item = data[i];

      if (item.url && item.title) {
        result.push({
          title: item.title,
          url: item.url,
        });
      }

      if (item.children && item.children.length) {
        clearUpFavorite(item.children);
      }
      i--;
    }
  }
  try {
    chrome.bookmarks.getTree(function (bookmarkArray: any[]) {
      try {
        clearUpFavorite(bookmarkArray);

        cb(result);
      } catch (e) {
        alert((e as Error)?.message);
      }
    });
  } catch (e) {
    if (IS_DEV) console.error('getMarkTree', e);
    console.warn('not in chrome plugin environment');
  }
}
