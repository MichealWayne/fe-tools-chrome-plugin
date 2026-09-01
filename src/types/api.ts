/**
 * API 相关类型定义
 * @author Wayne
 * @date 2024-04-15
 */

/**
 * Error categories returned by API helpers.
 */
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
}

/**
 * Supported HTTP methods for API requests.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Shared request configuration options for ApiClient.
 */
export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  retry?: boolean;
  retryTimes?: number;
  retryDelay?: number;
}

/**
 * Normalized API response envelope.
 */
export interface ApiResponseBase {
  success: boolean;
  message: string;
  statusCode: number;
  url: string;
}

/** Response envelope for endpoints that return one value. */
export interface ApiItemResponse<T = unknown> extends ApiResponseBase {
  data: T;
  list?: never;
}

/** Response envelope for endpoints that return a list of values. */
export interface ApiListResponse<T = unknown> extends ApiResponseBase {
  data?: never;
  list: T[];
}

/** Runtime response variants supported by the shared API client. */
export type ApiResponse<T = unknown> = ApiItemResponse<T> | ApiListResponse<T>;

export const isApiListResponse = <T>(response: ApiResponse<T>): response is ApiListResponse<T> =>
  Array.isArray(response.list);

export const isApiItemResponse = <T>(response: ApiResponse<T>): response is ApiItemResponse<T> =>
  Object.prototype.hasOwnProperty.call(response, 'data');

/**
 * Normalized API error payload.
 */
export interface ApiError extends ApiResponseBase {
  success: false;
  type: ErrorType;
}

/**
 * Tool list item returned by the tools endpoint.
 */
export interface ToolsData {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
}

/**
 * Translation request payload.
 */
export interface TranslateRequest {
  doctype: 'json';
  type: 'AUTO';
  i: string;
}

/**
 * Translation response payload.
 */
export interface TranslateResponse {
  translateResult?: Array<Array<{ tgt?: string }>>;
}

/**
 * MooCSS data entry returned by the API.
 */
export interface MooCSSData {
  module: string;
  className: string;
  description: string;
  example?: string;
}

/**
 * Regex catalog entry for the regex tool.
 */
export interface RegexData {
  name: string;
  description?: string;
  regexStr: string;
}

/**
 * Linux command example description.
 */
export interface LinuxCommandExample {
  command: string;
  description: string;
}

export interface LinuxCommandOption {
  flag: string;
  description: string;
}

/**
 * Linux command reference entry.
 */
export interface LinuxCommand {
  name: string;
  description: string;
  syntax: string;
  examples?: LinuxCommandExample[];
  options?: LinuxCommandOption[];
  tag?: string[];
}

/**
 * Metadata describing a utility function.
 */
export interface UtilFunction {
  name: string;
  module: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    optional?: boolean;
  }>;
  returnType: string;
  example?: string;
}

/**
 * API service method signatures for typed clients.
 */
export interface ApiEndpoints {
  getFeTools: () => Promise<ApiListResponse<ToolsData>>;
  handleTranslate: (data: TranslateRequest) => Promise<ApiItemResponse<TranslateResponse>>;
  getMooCSS: () => Promise<ApiListResponse<MooCSSData>>;
  getRegex: () => Promise<ApiListResponse<RegexData>>;
  getLinuxCommands: () => Promise<ApiListResponse<LinuxCommand>>;
  getUtilFuncs: () => Promise<ApiListResponse<UtilFunction>>;
}
