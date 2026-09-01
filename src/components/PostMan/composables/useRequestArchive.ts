import { nextTick, type Ref } from 'vue';
import { loadPostmanStorage, savePostmanStorage } from '../utils/storage';
import { cloneRequest, normalizeRequest } from '../utils/request-model';
import { redactRequest } from '../utils/redaction';
import type {
  PostmanEnvironment,
  PostmanHistoryItem,
  PostmanRequestConfig,
  SavedRequest,
} from '../types';

type Translate = (key: string, params?: Record<string, string | number>) => string;
type FeedbackTone = 'success' | 'error';

type RequestArchiveOptions = {
  request: PostmanRequestConfig;
  environments: Ref<PostmanEnvironment[]>;
  currentEnvironment: Ref<string>;
  requestHistory: Ref<PostmanHistoryItem[]>;
  savedRequests: Ref<SavedRequest[]>;
  setFeedback: (message: string, tone: FeedbackTone) => void;
  translate: Translate;
  focusUrl: () => void;
  closeDrawer: () => void;
  clearValidation: () => void;
};

/**
 * Coordinates PostMan request persistence, history, and file archive actions.
 * It intentionally keeps the existing storage envelope and user-facing callbacks.
 */
export const useRequestArchive = ({
  request,
  environments,
  currentEnvironment,
  requestHistory,
  savedRequests,
  setFeedback,
  translate,
  focusUrl,
  closeDrawer,
  clearValidation,
}: RequestArchiveOptions) => {
  const saveToStorage = () => {
    savePostmanStorage({
      environments: environments.value,
      currentEnvironment: currentEnvironment.value,
      requestHistory: requestHistory.value,
      savedRequests: savedRequests.value,
    });
  };

  const loadFromStorage = () => {
    const data = loadPostmanStorage();
    environments.value = data.environments;
    currentEnvironment.value = data.currentEnvironment;
    requestHistory.value = data.requestHistory;
    savedRequests.value = data.savedRequests || [];
    if (data.storageError === 'newer-version') {
      setFeedback(translate('postman.feedback.storageNewerVersion'), 'error');
    }
  };

  const addToHistory = (item: PostmanHistoryItem) => {
    requestHistory.value.unshift(item);
    const favorites = requestHistory.value.filter(entry => entry.favorite);
    const regular = requestHistory.value
      .filter(entry => !entry.favorite)
      .slice(0, Math.max(0, 50 - favorites.length));
    requestHistory.value = [...favorites, ...regular].sort((a, b) => b.timestamp - a.timestamp);
    saveToStorage();
  };

  const loadHistoryItem = (item: PostmanHistoryItem) => {
    if (item.request) {
      Object.assign(request, cloneRequest(item.request));
      currentEnvironment.value = item.environment || item.request.environment || '';
      clearValidation();
      closeDrawer();
      setFeedback(
        item.redacted
          ? translate('postman.feedback.historyLoadedRedacted')
          : translate('postman.feedback.historyLoaded'),
        'success'
      );
      return;
    }
    request.method = item.method;
    request.url = item.url;
    request.headers = Object.entries(item.headers).map(([key, value]) => ({ key, value }));
    request.body = { type: 'none' };
    request.auth = { type: 'none' };

    if (item.body) {
      if (typeof item.body === 'string') {
        request.body = { type: 'raw', raw: item.body };
      } else if (item.body instanceof FormData) {
        request.body = { type: 'form-data', formData: [] };
      } else {
        request.body = { type: 'json', json: JSON.stringify(item.body, null, 2) };
      }
    }
    setFeedback(translate('postman.feedback.historyLoaded'), 'success');
  };

  const clearHistory = () => {
    requestHistory.value = requestHistory.value.filter(item => item.favorite);
    saveToStorage();
    setFeedback(translate('postman.feedback.historyCleared'), 'success');
  };

  const toggleFavorite = (item: PostmanHistoryItem) => {
    item.favorite = !item.favorite;
    saveToStorage();
  };

  const removeHistoryItem = (index: number) => {
    requestHistory.value.splice(index, 1);
    saveToStorage();
    setFeedback(translate('postman.feedback.historyRemoved'), 'success');
  };

  const saveRequest = () => {
    const safe = redactRequest(request);
    const requestData = { ...safe.request, timestamp: Date.now() };
    const dataBlob = new Blob([JSON.stringify(requestData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `postman-request-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setFeedback(translate('postman.feedback.requestSaved'), 'success');
  };

  const loadRequest = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = loadEvent => {
        try {
          const requestData = JSON.parse(loadEvent.target?.result as string);
          Object.assign(request, normalizeRequest(requestData));
          setFeedback(translate('postman.feedback.requestLoaded'), 'success');
          nextTick(focusUrl);
        } catch {
          setFeedback(translate('postman.request.loadFailed'), 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return {
    saveToStorage,
    loadFromStorage,
    addToHistory,
    loadHistoryItem,
    clearHistory,
    toggleFavorite,
    removeHistoryItem,
    saveRequest,
    loadRequest,
  };
};
