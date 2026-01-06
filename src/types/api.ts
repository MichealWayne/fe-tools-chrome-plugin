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
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  statusCode: number;
  url: string;
  data?: T;
  list?: T[];
}

/**
 * Normalized API error payload.
 */
export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  type: ErrorType;
  url: string;
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
  text: string;
  from: string;
  to: string;
}

/**
 * Translation response payload.
 */
export interface TranslateResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
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
  id: string;
  name: string;
  pattern: string;
  description: string;
  example: string;
  flags?: string;
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
  getFeTools: () => Promise<ApiResponse<ToolsData[]>>;
  handleTranslate: (data: TranslateRequest) => Promise<ApiResponse<TranslateResponse>>;
  getMooCSS: () => Promise<ApiResponse<MooCSSData[]>>;
  getRegex: () => Promise<ApiResponse<RegexData[]>>;
  getLinuxCommands: () => Promise<ApiResponse<LinuxCommand[]>>;
  getUtilFuncs: () => Promise<ApiResponse<UtilFunction[]>>;
}
