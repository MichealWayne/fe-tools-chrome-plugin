import type {
  PostmanEnvironment,
  PostmanHistoryItem,
  PostmanPreferences,
  SavedRequest,
} from '../types';
import { DEFAULT_POSTMAN_PREFERENCES } from '../types';
import { normalizeEnvironment, normalizeRequest } from './request-model';
import { redactHeaderRecord, redactRequest } from './redaction';

export const POSTMAN_STORAGE_KEY = 'postman-data';
export const POSTMAN_STORAGE_VERSION = 2;

export type PostmanStorageState = {
  environments: PostmanEnvironment[];
  currentEnvironment: string;
  requestHistory: PostmanHistoryItem[];
  savedRequests?: SavedRequest[];
  preferences?: PostmanPreferences;
  storageError?: 'newer-version';
};

type PostmanStorageEnvelope = Required<Omit<PostmanStorageState, 'storageError'>> & {
  version: number;
  legacySnapshot?: string;
};

const emptyState = (): PostmanStorageState => ({
  environments: [],
  currentEnvironment: '',
  requestHistory: [],
  savedRequests: [],
  preferences: { ...DEFAULT_POSTMAN_PREFERENCES },
});

const capHistory = (history: PostmanHistoryItem[], limit: number): PostmanHistoryItem[] => {
  const favorites = history.filter(item => item.favorite);
  const regular = history
    .filter(item => !item.favorite)
    .slice(0, Math.max(0, limit - favorites.length));
  return [...favorites, ...regular].sort((a, b) => b.timestamp - a.timestamp);
};

const sanitizeHistory = (history: PostmanHistoryItem[]): PostmanHistoryItem[] =>
  history.map(item => {
    const redactedRequest = item.request ? redactRequest(item.request) : null;
    return {
      ...item,
      headers: redactHeaderRecord(item.headers || {}),
      request: redactedRequest?.request,
      redacted: Boolean(item.redacted || redactedRequest?.redacted),
    };
  });

const sanitizeSavedRequests = (saved: SavedRequest[]): SavedRequest[] =>
  saved.map(item => {
    const redacted = redactRequest(item.request);
    return { ...item, request: redacted.request, redacted: item.redacted || redacted.redacted };
  });

const toEnvelope = (
  state: PostmanStorageState,
  legacySnapshot?: string
): PostmanStorageEnvelope => {
  const preferences = { ...DEFAULT_POSTMAN_PREFERENCES, ...state.preferences };
  return {
    version: POSTMAN_STORAGE_VERSION,
    environments: (state.environments || []).map(normalizeEnvironment),
    currentEnvironment: state.currentEnvironment || '',
    requestHistory: capHistory(
      sanitizeHistory(state.requestHistory || []),
      preferences.historyLimit
    ),
    savedRequests: sanitizeSavedRequests(state.savedRequests || []),
    preferences,
    ...(legacySnapshot ? { legacySnapshot } : {}),
  };
};

export const savePostmanStorage = (state: PostmanStorageState): boolean => {
  const current = localStorage.getItem(POSTMAN_STORAGE_KEY);
  let legacySnapshot: string | undefined;
  try {
    const parsed = current ? JSON.parse(current) : null;
    if (parsed && typeof parsed === 'object' && !('version' in parsed))
      legacySnapshot = current || undefined;
    if (parsed?.version > POSTMAN_STORAGE_VERSION) return false;
  } catch {
    legacySnapshot = current || undefined;
  }
  localStorage.setItem(POSTMAN_STORAGE_KEY, JSON.stringify(toEnvelope(state, legacySnapshot)));
  return true;
};

export const loadPostmanStorage = (): PostmanStorageState => {
  const raw = localStorage.getItem(POSTMAN_STORAGE_KEY);
  if (!raw) return emptyState();
  try {
    const parsed = JSON.parse(raw) as Partial<PostmanStorageEnvelope> & { version?: number };
    if (typeof parsed.version === 'number' && parsed.version > POSTMAN_STORAGE_VERSION) {
      return { ...emptyState(), storageError: 'newer-version' };
    }
    const migrated = toEnvelope(
      {
        environments: Array.isArray(parsed.environments)
          ? parsed.environments.filter(item => item && typeof item.name === 'string')
          : [],
        currentEnvironment:
          typeof parsed.currentEnvironment === 'string' ? parsed.currentEnvironment : '',
        requestHistory: Array.isArray(parsed.requestHistory)
          ? parsed.requestHistory
              .filter(
                item => item && typeof item.url === 'string' && typeof item.timestamp === 'number'
              )
              .map(item => ({
                ...item,
                request: item.request ? normalizeRequest(item.request) : undefined,
                headers: item.headers || {},
              }))
          : [],
        savedRequests: Array.isArray(parsed.savedRequests)
          ? parsed.savedRequests.filter(
              item => item && item.request && typeof item.name === 'string'
            )
          : [],
        preferences: { ...DEFAULT_POSTMAN_PREFERENCES, ...parsed.preferences },
      },
      parsed.version ? parsed.legacySnapshot : raw
    );
    if (!parsed.version) localStorage.setItem(POSTMAN_STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch (error) {
    console.error('加载本地数据失败:', error);
    return emptyState();
  }
};
