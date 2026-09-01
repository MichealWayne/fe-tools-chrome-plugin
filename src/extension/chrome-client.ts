import type { BackgroundMessage, RuntimeMessage, TabMessage } from './messages';

type ResponseGuard<T> = (value: unknown) => value is T;

const getLastError = () => {
  const message = chrome.runtime.lastError?.message;
  return message ? new Error(message) : undefined;
};

const assertResponse = <T>(action: string, response: unknown, guard?: ResponseGuard<T>): T => {
  if (guard && !guard(response)) {
    throw new TypeError(`Invalid response for Chrome message: ${action}`);
  }
  return response as T;
};

export const sendTabMessage = <T>(
  tabId: number,
  message: TabMessage,
  guard?: ResponseGuard<T>
): Promise<T> =>
  new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      const error = getLastError();
      if (error) {
        reject(error);
        return;
      }
      try {
        resolve(assertResponse(message.action, response, guard));
      } catch (error) {
        reject(error);
      }
    });
  });

export const sendRuntimeMessage = <T>(
  message: RuntimeMessage | BackgroundMessage,
  guard?: ResponseGuard<T>
): Promise<T> =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      const error = getLastError();
      if (error) {
        reject(error);
        return;
      }
      try {
        resolve(assertResponse(message.action, response, guard));
      } catch (error) {
        reject(error);
      }
    });
  });
