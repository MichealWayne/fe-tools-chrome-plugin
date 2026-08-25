import type { PostmanEnvironment, PostmanHistoryItem } from '../types';

export type PostmanStorageState = {
  environments: PostmanEnvironment[];
  currentEnvironment: string;
  requestHistory: PostmanHistoryItem[];
};

export const POSTMAN_STORAGE_KEY = 'postman-data';
const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'proxy-authorization',
]);

const sanitizeHistory = (history: PostmanHistoryItem[]): PostmanHistoryItem[] =>
  history.map(item => ({
    ...item,
    headers: Object.fromEntries(
      Object.entries(item.headers).filter(([key]) => !SENSITIVE_HEADER_NAMES.has(key.toLowerCase()))
    ),
  }));

/**
 * Persist Postman state to localStorage.
 * @param state - Storage payload for environments and history.
 */
export const savePostmanStorage = (state: PostmanStorageState) => {
  localStorage.setItem(
    POSTMAN_STORAGE_KEY,
    JSON.stringify({ ...state, requestHistory: sanitizeHistory(state.requestHistory) })
  );
};

/**
 * Restore Postman state from localStorage.
 */
export const loadPostmanStorage = (): PostmanStorageState => {
  try {
    const data = localStorage.getItem(POSTMAN_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data) as Partial<PostmanStorageState>;
      return {
        environments: parsed.environments || [],
        currentEnvironment: parsed.currentEnvironment || '',
        requestHistory: parsed.requestHistory || [],
      };
    }
  } catch (error) {
    console.error('加载本地数据失败:', error);
  }

  return {
    environments: [],
    currentEnvironment: '',
    requestHistory: [],
  };
};
