import { sendTabMessage } from '@/extension/chrome-client';
import { isPageMetrics, isScrollResponse, type PageMetrics } from '@/extension/messages';

const executeScript = <T>(tabId: number, func: (...args: unknown[]) => T, args: unknown[] = []) =>
  new Promise<T>((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func,
        args,
      },
      results => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve(results?.[0]?.result as T);
      }
    );
  });

const executeScriptFiles = (tabId: number, files: string[]) =>
  new Promise<void>((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        files,
      },
      () => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve();
      }
    );
  });

const getPageMetrics = async (tabId: number) => {
  try {
    return await sendTabMessage<PageMetrics>(tabId, { action: 'getPageMetrics' }, isPageMetrics);
  } catch {
    return executeScript(tabId, () => {
      const doc = document.documentElement;
      const body = document.body;
      return {
        totalWidth: Math.max(doc.scrollWidth, body ? body.scrollWidth : 0),
        totalHeight: Math.max(doc.scrollHeight, body ? body.scrollHeight : 0),
        viewportWidth: window.innerWidth || doc.clientWidth,
        viewportHeight: window.innerHeight || doc.clientHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        scrollY: window.scrollY || window.pageYOffset || doc.scrollTop || 0,
      };
    });
  }
};

const scrollToPosition = async (tabId: number, y: number) => {
  try {
    return await sendTabMessage<{ scrollY: number }>(
      tabId,
      { action: 'scrollTo', y, delay: 0 },
      isScrollResponse
    );
  } catch {
    return executeScript(
      tabId,
      (targetY: unknown) => {
        window.scrollTo(0, targetY as number);
        const doc = document.documentElement;
        return {
          scrollY: window.scrollY || window.pageYOffset || doc.scrollTop || 0,
        };
      },
      [y]
    );
  }
};

const setPageCaptureMode = async (tabId: number, mode: 'prepare' | 'segment' | 'restore') =>
  executeScript(
    tabId,
    (action: unknown) => {
      const styleId = 'fe-tools-capture-style';
      const marker = 'data-fe-tools-capture-kind';
      const hidden = 'data-fe-tools-capture-hidden';
      if (action === 'restore') {
        document.querySelectorAll(`[${marker}]`).forEach(node => {
          node.removeAttribute(marker);
          node.removeAttribute('data-fe-tools-capture-top');
          node.removeAttribute(hidden);
        });
        document.getElementById(styleId)?.remove();
        return;
      }
      if (action === 'prepare') {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `html { scroll-behavior: auto !important; } [${hidden}] { visibility: hidden !important; }`;
        document.documentElement.appendChild(style);
        return;
      }
      if (window.scrollY === 0) {
        document.querySelectorAll('*').forEach(node => {
          const element = node as HTMLElement;
          const position = getComputedStyle(element).position;
          if (position !== 'fixed' && position !== 'sticky') return;
          element.setAttribute(marker, position);
          element.setAttribute(
            'data-fe-tools-capture-top',
            String(element.getBoundingClientRect().top)
          );
        });
      }
      document.querySelectorAll(`[${marker}]`).forEach(node => {
        const element = node as HTMLElement;
        const kind = element.getAttribute(marker);
        const naturalTop = Number(element.getAttribute('data-fe-tools-capture-top'));
        const stickyTop = parseFloat(getComputedStyle(element).top) || 0;
        const isStuck =
          kind === 'sticky' &&
          window.scrollY > naturalTop &&
          element.getBoundingClientRect().top <= stickyTop + 2;
        if (window.scrollY > 0 && (kind === 'fixed' || isStuck)) {
          element.setAttribute(hidden, '');
        } else {
          element.removeAttribute(hidden);
        }
      });
    },
    [mode]
  );

export { executeScriptFiles, getPageMetrics, scrollToPosition, setPageCaptureMode };
