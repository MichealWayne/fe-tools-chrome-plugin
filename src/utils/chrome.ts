/**
 * @author Wayne
 * @Date 2019-10-02 14:48:29
 * @LastEditTime 2023-11-26 10:02:13
 */

import { AnyFunc, AnyObj } from '@/types';
import { IS_DEV } from '@/constant';

/**
 * Open a URL in a new browser tab (Chrome extension context).
 * @param url - Target URL to open.
 */
export function jumpAction(url: string) {
  if (!url) {
    IS_DEV && console.warn(`no jump url.(jumpAction, url: ${url})`);
    return;
  }
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
 * Get the URL of the currently active tab.
 * @param cb - Callback invoked with the active tab URL and tab object.
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
 * Retrieve bookmarks and flatten them into a list.
 * @param cb - Callback invoked with the flattened bookmark list.
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

      if (item.children?.length) {
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
