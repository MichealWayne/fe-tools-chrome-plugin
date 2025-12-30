/**
 * API 相关类型定义
 * @author Wayne
 * @date 2024-04-15
 */

// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
}

// HTTP 方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// 请求配置接口
export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  retry?: boolean;
  retryTimes?: number;
  retryDelay?: number;
}

// API 响应接口（对象放 data，数组放 list）
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  statusCode: number;
  url: string;
  data?: T;
  list?: T[];
}

// API 错误接口
export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  type: ErrorType;
  url: string;
}

// 具体业务接口类型
// 工具列表条目
export interface ToolsData {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
}

// 翻译请求
export interface TranslateRequest {
  text: string;
  from: string;
  to: string;
}

// 翻译响应
export interface TranslateResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

// MooCSS 结构
export interface MooCSSData {
  module: string;
  className: string;
  description: string;
  example?: string;
}

// 正则表达式条目
export interface RegexData {
  id: string;
  name: string;
  pattern: string;
  description: string;
  example: string;
  flags?: string;
}

// Linux 命令文档结构
export interface LinuxCommandExample {
  command: string;
  description: string;
}

export interface LinuxCommandOption {
  flag: string;
  description: string;
}

export interface LinuxCommand {
  name: string;
  description: string;
  syntax: string;
  examples?: LinuxCommandExample[];
  options?: LinuxCommandOption[];
  tag?: string[];
}

// 工具函数元信息
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

// API 接口映射类型
// API 服务类公开方法签名
export interface ApiEndpoints {
  getFeTools: () => Promise<ApiResponse<ToolsData[]>>;
  handleTranslate: (data: TranslateRequest) => Promise<ApiResponse<TranslateResponse>>;
  getMooCSS: () => Promise<ApiResponse<MooCSSData[]>>;
  getRegex: () => Promise<ApiResponse<RegexData[]>>;
  getLinuxCommands: () => Promise<ApiResponse<LinuxCommand[]>>;
  getUtilFuncs: () => Promise<ApiResponse<UtilFunction[]>>;
}
