/**
 * 组件相关类型定义
 * @author Wayne
 * @date 2024-04-15
 */

// HTTP 方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// 二维码配置
export interface QRCodeOptions {
  text: string;
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  type?: 'canvas' | 'svg';
}

// 二维码生成结果：可导出或下载
export interface QRCodeResult {
  getDataURL(): string;
  download(filename?: string): void;
}

// 图片压缩配置
export interface ImageCompressOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

// 压缩结果：体积与比率
export interface CompressResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dataUrl: string;
}

// PostMan 相关类型
// Postman 模拟请求配置
export interface AuthConfig {
  type: 'none' | 'bearer' | 'basic' | 'api-key';
  token?: string;
  username?: string;
  password?: string;
  key?: string;
  value?: string;
  addTo?: 'header' | 'query';
}

export interface PostmanRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  auth?: AuthConfig;
  params?: Record<string, string>;
}

// Postman 响应模型
export interface PostmanResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  responseTime: number;
  size: number;
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
}

// JSON 工具相关
// JSON 格式化配置
export interface JsonFormatOptions {
  indent?: number | null;
  sortKeys?: boolean;
  removeComments?: boolean;
}

// JSON 校验结果
export interface JsonValidationResult {
  isValid: boolean;
  error?: string;
  lineNumber?: number;
  columnNumber?: number;
}

// 颜色转换相关
// 颜色值集合
export interface ColorValue {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  hsv: { h: number; s: number; v: number };
}

export interface ColorConvertOptions {
  format: 'hex' | 'rgb' | 'hsl' | 'hsv';
  uppercase?: boolean;
  includeAlpha?: boolean;
}

// 日期转换相关
export interface DateConvertOptions {
  format?: string;
  timezone?: string;
  locale?: string;
}

// 日期转换结果
export interface DateResult {
  timestamp: number;
  iso: string;
  local: string;
  utc: string;
  formatted?: string;
}

// 单位换算相关
export interface UnitConvertOptions {
  fromUnit: string;
  toUnit: string;
  value: number;
  precision?: number;
}

// 单位换算结果
export interface UnitResult {
  value: number;
  unit: string;
  formatted: string;
}

// SVG 编辑器相关
export interface SvgOptimizeOptions {
  removeComments?: boolean;
  removeMetadata?: boolean;
  removeEditorsNSData?: boolean;
  cleanupAttrs?: boolean;
  minifyStyles?: boolean;
  convertStyleToAttrs?: boolean;
}

// SVG 压缩结果
export interface SvgOptimizeResult {
  optimizedSvg: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

// 语言翻译相关
export interface TranslateOptions {
  from: string;
  to: string;
  text: string;
}

// 翻译结果
export interface TranslateResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
}

// 正则表达式相关
export interface RegexTestOptions {
  pattern: string;
  flags?: string;
  testString: string;
}

// 正则测试结果
export interface RegexTestResult {
  matches: RegExpMatchArray[];
  isMatch: boolean;
  matchCount: number;
  executionTime: number;
}

// 通用组件 Props
// 通用组件基础属性
export interface BaseComponentProps {
  loading?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark';
}

// 表单相关
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
  value: unknown;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: unknown }>;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: unknown) => boolean | string;
  };
}

// 表单数据字典
export interface FormData {
  [key: string]: unknown;
}

// 表单校验结果
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// 事件相关
// 组件事件基类
export interface ComponentEvent<T = unknown> {
  type: string;
  data?: T;
  timestamp: number;
}

export interface FileUploadEvent extends ComponentEvent {
  data: {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
  };
}

export interface SearchEvent extends ComponentEvent {
  data: {
    query: string;
    filters?: Record<string, unknown>;
    results?: unknown[];
  };
}
