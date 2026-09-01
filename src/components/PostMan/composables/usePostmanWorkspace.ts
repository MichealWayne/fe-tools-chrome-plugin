import type { Ref } from 'vue';
import { cloneRequest, normalizeRequest } from '../utils/request-model';
import type { PostmanRequestConfig, SavedRequest } from '../types';
import type { PostmanDrawer } from './useDrawerFocus';

type FeedbackTone = 'success' | 'error';

type PostmanWorkspaceOptions = {
  request: PostmanRequestConfig;
  activeDrawer: Ref<PostmanDrawer>;
  setFeedback: (message: string, tone: FeedbackTone) => void;
  translate: (key: string, params?: Record<string, string | number>) => string;
};

/** Coordinates normalized request updates between PostMan child panels. */
export const usePostmanWorkspace = ({
  request,
  activeDrawer,
  setFeedback,
  translate,
}: PostmanWorkspaceOptions) => {
  const updateRequest = (newRequest: Partial<PostmanRequestConfig>) => {
    Object.assign(request, normalizeRequest({ ...request, ...newRequest } as PostmanRequestConfig));
  };

  const loadSavedRequest = (saved: SavedRequest) => {
    Object.assign(request, cloneRequest(saved.request));
    activeDrawer.value = '';
    setFeedback(
      saved.redacted
        ? translate('postman.feedback.requestLoadedRedacted')
        : translate('postman.feedback.requestLoaded'),
      'success'
    );
  };

  const applyImportedRequest = (imported: PostmanRequestConfig) => {
    Object.assign(request, normalizeRequest(imported));
    activeDrawer.value = '';
    setFeedback(translate('postman.feedback.curlImported'), 'success');
  };

  return { updateRequest, loadSavedRequest, applyImportedRequest };
};
