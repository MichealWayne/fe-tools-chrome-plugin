/**
 * API 客户端类
 * @author Wayne
 * @date 2024-04-15
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, ApiError, RequestConfig, ErrorType } from '@/types/api';

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
function shouldRetry(error: any): boolean {
  const { response } = error;
  /**
   * Retry on network failures when no response is available.
   */
  if (!response) return true;

  const { status } = response;
  /**
   * Retry on server errors or gateway timeouts.
   */
  return status >= 500 || status === 408;
}

/**
 * Create a retryable request wrapper with exponential-ish backoff.
 * @param requestFn - Function that performs the request.
 * @param maxRetries - Remaining retry attempts.
 */
function createRetryableRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = API_CONFIG.retryTimes
): Promise<T> {
  /**
   * Retry recursively until all attempts are exhausted.
   */
  return requestFn().catch(async error => {
    if (maxRetries > 0 && shouldRetry(error)) {
      await delay(API_CONFIG.retryDelay);
      return createRetryableRequest(requestFn, maxRetries - 1);
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
    /**
     * Inject common request/response handling across all requests.
     */
    this.instance.interceptors.request.use(
      config => {
        const modifiedConfig = this.handleRequest(config);
        return modifiedConfig as any;
      },
      error => Promise.reject(this.handleError(error, ''))
    );

    /**
     * Normalize Axios responses and errors for the caller.
     */
    this.instance.interceptors.response.use(
      response => {
        /**
         * Return raw Axios response for downstream processing.
         */
        return response;
      },
      error => Promise.reject(this.handleError(error, error.config?.url || ''))
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

  private handleError(error: any, url: string): ApiError {
    /**
     * Map Axios errors into the shared ApiError structure.
     */
    const { response, code, message, config } = error;

    let errorType: ErrorType;
    let statusCode: number;
    let errorMessage: string;

    if (code === 'ECONNABORTED') {
      errorType = ErrorType.TIMEOUT_ERROR;
      statusCode = 408;
      errorMessage = '请求超时';
    } else if (response) {
      const { status, data, statusText } = response;
      statusCode = status;

      if (status >= 500) {
        errorType = ErrorType.SERVER_ERROR;
      } else if (status >= 400) {
        errorType = ErrorType.CLIENT_ERROR;
      } else {
        errorType = ErrorType.NETWORK_ERROR;
      }

      errorMessage = data?.message || statusText || '请求失败';
    } else {
      errorType = ErrorType.NETWORK_ERROR;
      statusCode = 0;
      errorMessage = message || '网络错误';
    }

    return {
      success: false,
      statusCode,
      message: errorMessage,
      type: errorType,
      url: config?.url || url,
    };
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
        config.retryTimes
      );
    }

    const response = await this.instance.get(url, requestConfig);
    return this.handleSuccess(response);
  }

  /**
   * Perform a POST request with retry logic enabled by default.
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

    if (config.retry !== false) {
      return createRetryableRequest(
        () => this.instance.post(url, data, requestConfig).then(res => this.handleSuccess(res)),
        config.retryTimes
      );
    }

    const response = await this.instance.post(url, data, requestConfig);
    return this.handleSuccess(response);
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
