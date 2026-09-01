import { computed, ref } from 'vue';
import axios, { type AxiosResponse, type Method } from 'axios';
import type { PostmanRequestConfig, RequestExecutionState } from '../types';
import { buildRequestPayload, type EnvValueResolver } from '../utils/request-builder';

const responseSize = (data: unknown): number => {
  const value = typeof data === 'string' ? data : JSON.stringify(data) || '';
  return new Blob([value]).size;
};

export const useRequestExecution = () => {
  const state = ref<RequestExecutionState>({ type: 'idle' });
  const controller = ref<AbortController | null>(null);
  const cancelReason = ref<'user' | null>(null);
  const loading = computed(() => state.value.type === 'pending');

  const cancel = () => {
    if (!controller.value) return;
    cancelReason.value = 'user';
    controller.value.abort();
  };

  const execute = async (request: PostmanRequestConfig, resolveValue: EnvValueResolver) => {
    if (loading.value) return null;
    const startedAt = Date.now();
    const timeout = request.settings?.timeout || 30000;
    const activeController = new AbortController();
    controller.value = activeController;
    cancelReason.value = null;
    state.value = { type: 'pending', startedAt };

    try {
      const payload = buildRequestPayload(request, resolveValue);
      const result: AxiosResponse = await axios({
        method: request.method.toLowerCase() as Method,
        url: payload.url,
        headers: payload.headers,
        data: payload.data,
        timeout,
        signal: activeController.signal,
      });
      const response = {
        status: result.status,
        statusText: result.statusText,
        headers: result.headers as Record<string, string | string[]>,
        data: result.data,
        responseTime: Date.now() - startedAt,
        size: responseSize(result.data),
      };
      state.value = { type: 'received', response };
      return response;
    } catch (error) {
      if (cancelReason.value === 'user' || activeController.signal.aborted) {
        state.value = { type: 'cancelled' };
        return null;
      }
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        state.value = { type: 'timeout', timeout };
        return null;
      }
      if (axios.isAxiosError(error) && error.response) {
        const response = {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers as Record<string, string | string[]>,
          data: error.response.data,
          responseTime: Date.now() - startedAt,
          size: responseSize(error.response.data),
        };
        state.value = { type: 'received', response };
        return response;
      }
      state.value = {
        type: 'network-error',
        message: axios.isAxiosError(error) ? error.message : (error as Error).message,
      };
      return null;
    } finally {
      if (controller.value === activeController) controller.value = null;
    }
  };

  const reset = () => {
    if (!loading.value) state.value = { type: 'idle' };
  };

  return { state, loading, execute, cancel, reset };
};
