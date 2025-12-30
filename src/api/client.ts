/**
 * API 客户端类
 * @author Wayne
 * @date 2024-04-15
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, ApiError, RequestConfig, ErrorType } from '@/types/api';

// API 配置
const API_CONFIG = {
  timeout: {
    get: 8000,
    post: 10000,
    default: 5000,
  },
  retryTimes: 3,
  retryDelay: 1000,
};

// 延迟函数
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// 判断是否应该重试
function shouldRetry(error: any): boolean {
  const { response } = error;
  if (!response) return true; // 网络错误重试

  const { status } = response;
  return status >= 500 || status === 408; // 服务器错误或超时重试
}

// 创建重试请求
function createRetryableRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = API_CONFIG.retryTimes
): Promise<T> {
  // 递归重试，直到耗尽次数
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
    // 统一注入请求/响应处理逻辑
    // 请求拦截器
    this.instance.interceptors.request.use(
      config => {
        const modifiedConfig = this.handleRequest(config);
        return modifiedConfig as any;
      },
      error => Promise.reject(this.handleError(error, ''))
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      response => {
        // 直接返回响应，让axios处理
        return response;
      },
      error => Promise.reject(this.handleError(error, error.config?.url || ''))
    );
  }

  private handleRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    // 处理通用请求头与缓存参数
    // 添加通用请求头
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        _t: Date.now(),
        ...config.params,
      };
    }

    return config;
  }

  private handleSuccess<T>(response: AxiosResponse<T>): ApiResponse<T> {
    // 规范化响应结构，统一 data/list 字段
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
    // 统一错误分类与描述
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

  // GET 请求：默认包含重试逻辑
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

  // POST 请求：默认包含重试逻辑
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

// 创建默认实例
export const apiClient = new ApiClient();
