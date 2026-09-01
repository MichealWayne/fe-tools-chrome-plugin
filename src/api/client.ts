/**
 * API 客户端类
 * @author Wayne
 * @date 2024-04-15
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  ApiItemResponse,
  ApiListResponse,
  ApiResponse,
  isApiItemResponse,
  isApiListResponse,
  RequestConfig,
} from '@/types/api';

/**
 * Default API configuration for timeouts and retries.
 */
const API_CONFIG = {
  timeout: {
    get: 8000,
    post: 10000,
    default: 5000,
  },
  retryTimes: 3,
  retryDelay: 1000,
};

/**
 * Delay helper used to back off between retries.
 * @param ms - Delay duration in milliseconds.
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Determine whether a request should be retried based on the error.
 * @param error - Axios error object.
 * @returns Whether the request is retryable.
 */
function shouldRetry(error: unknown): boolean {
  const response = (error as { response?: { status?: number } })?.response;
  /**
   * Retry on network failures when no response is available.
   */
  if (!response) return true;

  const { status } = response;
  /**
   * Retry on server errors or gateway timeouts.
   */
  return (status ?? 0) >= 500 || status === 408;
}

/**
 * Create a retryable request wrapper with exponential-ish backoff.
 * @param requestFn - Function that performs the request.
 * @param maxRetries - Remaining retry attempts.
 */
function createRetryableRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = API_CONFIG.retryTimes,
  retryDelay: number = API_CONFIG.retryDelay
): Promise<T> {
  /**
   * Retry recursively until all attempts are exhausted.
   */
  return requestFn().catch(async error => {
    if (maxRetries > 0 && shouldRetry(error)) {
      await delay(retryDelay);
      return createRetryableRequest(requestFn, maxRetries - 1, retryDelay);
    }
    throw error;
  });
}

export class ApiClient {
  private instance: AxiosInstance;
  private readonly baseConfig: AxiosRequestConfig;

  constructor(baseConfig: AxiosRequestConfig = {}) {
    this.baseConfig = {
      timeout: API_CONFIG.timeout.default,
      ...baseConfig,
    };

    this.instance = axios.create(this.baseConfig);
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    /** Inject common request handling across all requests. */
    this.instance.interceptors.request.use(
      config => {
        const modifiedConfig = this.handleRequest(config);
        return modifiedConfig as any;
      },
      error => Promise.reject(error)
    );
  }

  private handleRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    /**
     * Attach common headers and cache-busting params.
     */
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    /**
     * Add a timestamp query param to avoid cached GET responses.
     */
    if (config.method === 'get') {
      config.params = {
        _t: Date.now(),
        ...config.params,
      };
    }

    return config;
  }

  private handleSuccess<T>(response: AxiosResponse<T>): ApiResponse<T> {
    /**
     * Normalize response payloads into ApiResponse shape.
     */
    const { data, status, statusText, config } = response;

    let result: ApiResponse<T>;

    if (Array.isArray(data)) {
      result = {
        success: true,
        message: statusText,
        statusCode: status,
        url: config.url || '',
        list: data,
      };
    } else if (typeof data === 'object' && data !== null) {
      result = {
        success: true,
        message: statusText,
        statusCode: status,
        url: config.url || '',
        data,
      };
    } else {
      result = {
        success: true,
        message: statusText,
        statusCode: status,
        url: config.url || '',
        data: data as T,
      };
    }

    return result;
  }

  /**
   * Perform a GET request with retry logic enabled by default.
   * @param url - Endpoint URL.
   * @param params - Query parameters.
   * @param config - Optional request overrides.
   */
  async get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      params,
      timeout: config.timeout || API_CONFIG.timeout.get,
      ...config,
    };

    if (config.retry !== false) {
      return createRetryableRequest(
        () => this.instance.get(url, requestConfig).then(res => this.handleSuccess(res)),
        config.retryTimes,
        config.retryDelay
      );
    }

    const response = await this.instance.get(url, requestConfig);
    return this.handleSuccess(response);
  }

  /**
   * Perform a GET request for an endpoint whose runtime payload is an array.
   * This preserves the shared runtime normalization while exposing the item type to callers.
   */
  async getList<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config: RequestConfig = {}
  ): Promise<ApiListResponse<T>> {
    const response = await this.get<T>(url, params, config);
    if (isApiListResponse(response)) return response;
    throw new TypeError(`Expected a list response from ${url}`);
  }

  /**
   * Perform a POST request. Retrying is opt-in because POST requests may not be idempotent.
   * @param url - Endpoint URL.
   * @param data - Request payload.
   * @param config - Optional request overrides.
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      timeout: config.timeout || API_CONFIG.timeout.post,
      ...config,
    };

    if (config.retry === true) {
      return createRetryableRequest(
        () => this.instance.post(url, data, requestConfig).then(res => this.handleSuccess(res)),
        config.retryTimes,
        config.retryDelay
      );
    }

    const response = await this.instance.post(url, data, requestConfig);
    return this.handleSuccess(response);
  }

  /**
   * Perform a POST request for an endpoint whose runtime payload is a single value.
   */
  async postItem<T = unknown>(
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiItemResponse<T>> {
    const response = await this.post<T>(url, data, config);
    if (isApiItemResponse(response)) return response;
    throw new TypeError(`Expected an item response from ${url}`);
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      timeout: config.timeout || API_CONFIG.timeout.post,
      ...config,
    };

    const response = await this.instance.put(url, data, requestConfig);
    return this.handleSuccess(response);
  }

  async delete<T = unknown>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      timeout: config.timeout || API_CONFIG.timeout.get,
      ...config,
    };

    const response = await this.instance.delete(url, requestConfig);
    return this.handleSuccess(response);
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      timeout: config.timeout || API_CONFIG.timeout.post,
      ...config,
    };

    const response = await this.instance.patch(url, data, requestConfig);
    return this.handleSuccess(response);
  }
}

/**
 * Default API client instance used by shared services.
 */
export const apiClient = new ApiClient();
