import { nextTick, reactive, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { useDrawerFocus } from '@/components/PostMan/composables/useDrawerFocus';
import { usePostmanWorkspace } from '@/components/PostMan/composables/usePostmanWorkspace';
import { useRequestArchive } from '@/components/PostMan/composables/useRequestArchive';
import type {
  PostmanEnvironment,
  PostmanHistoryItem,
  PostmanRequestConfig,
  SavedRequest,
} from '@/components/PostMan/types';

const createRequest = (): PostmanRequestConfig => ({
  method: 'GET',
  url: 'https://api.test',
  headers: [],
  body: { type: 'none' },
  auth: { type: 'none' },
});

const createArchive = () => {
  const request = reactive(createRequest());
  const environments = ref<PostmanEnvironment[]>([]);
  const currentEnvironment = ref('');
  const requestHistory = ref<PostmanHistoryItem[]>([]);
  const savedRequests = ref<SavedRequest[]>([]);
  const closeDrawer = vi.fn();
  const clearValidation = vi.fn();
  const setFeedback = vi.fn();
  const archive = useRequestArchive({
    request,
    environments,
    currentEnvironment,
    requestHistory,
    savedRequests,
    setFeedback,
    translate: key => key,
    focusUrl: vi.fn(),
    closeDrawer,
    clearValidation,
  });
  return { archive, request, currentEnvironment, requestHistory, closeDrawer, clearValidation };
};

describe('PostMan composables', () => {
  it('keeps favorite history and caps regular entries at the existing limit', () => {
    const { archive, requestHistory } = createArchive();
    requestHistory.value = Array.from({ length: 50 }, (_, index) => ({
      method: 'GET',
      url: `https://api.test/${index}`,
      headers: {},
      timestamp: index,
      favorite: index === 0,
    }));

    archive.addToHistory({
      method: 'POST',
      url: 'https://api.test/new',
      headers: {},
      timestamp: 100,
    });

    expect(requestHistory.value).toHaveLength(50);
    expect(requestHistory.value.some(item => item.favorite && item.url.endsWith('/0'))).toBe(true);
    expect(requestHistory.value.some(item => item.url.endsWith('/49'))).toBe(false);
  });

  it('restores a structured history request and clears validation state', () => {
    const { archive, request, currentEnvironment, closeDrawer, clearValidation } = createArchive();
    archive.loadHistoryItem({
      method: 'POST',
      url: 'https://legacy.test',
      headers: {},
      timestamp: 1,
      environment: 'Dev',
      redacted: true,
      request: {
        ...createRequest(),
        method: 'POST',
        url: 'https://saved.test',
        environment: 'Dev',
      },
    });

    expect(request.url).toBe('https://saved.test');
    expect(currentEnvironment.value).toBe('Dev');
    expect(closeDrawer).toHaveBeenCalledOnce();
    expect(clearValidation).toHaveBeenCalledOnce();
  });

  it('normalizes child request updates without changing the workspace contract', () => {
    const request = reactive(createRequest());
    const activeDrawer = ref<'environments' | 'history' | 'saved' | 'curl' | ''>('history');
    const setFeedback = vi.fn();
    const workspace = usePostmanWorkspace({
      request,
      activeDrawer,
      setFeedback,
      translate: key => key,
    });

    workspace.updateRequest({ url: 'https://updated.test', headers: [{ key: 'x', value: '1' }] });
    expect(request.url).toBe('https://updated.test');
    expect(request.headers[0]).toMatchObject({ key: 'x', value: '1', enabled: true });
  });

  it('focuses the active drawer and wraps reverse tab navigation', async () => {
    const activeDrawer = ref<'environments' | 'history' | 'saved' | 'curl' | ''>('');
    const drawer = document.createElement('section');
    drawer.tabIndex = -1;
    const first = document.createElement('button');
    const last = document.createElement('button');
    drawer.append(first, last);
    document.body.append(drawer);
    const drawerRef = ref<HTMLElement | null>(drawer);
    const { trapDrawerFocus } = useDrawerFocus({ activeDrawer, drawerRef });

    activeDrawer.value = 'history';
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(drawer);

    first.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true });
    trapDrawerFocus(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
    drawer.remove();
  });
});
