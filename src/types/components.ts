/**
 * 组件相关类型定义
 * @author Wayne
 * @date 2024-04-15
 */

/**
 * Supported HTTP methods for request tooling.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Configuration for QR code rendering.
 */
export interface QRCodeOptions {
  text: string;
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  type?: 'canvas' | 'svg';
}

/**
 * QR code render result with export helpers.
 */
export interface QRCodeResult {
  getDataURL(): string;
  download(filename?: string): void;
}

/**
 * Image compression settings.
 */
export interface ImageCompressOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Image compression result metrics.
 */
export interface CompressResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dataUrl: string;
}

/**
 * Auth configuration for PostMan requests.
 */
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

/**
 * PostMan response payload for display.
 */
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

/**
 * JSON formatting options.
 */
export interface JsonFormatOptions {
  indent?: number | null;
  sortKeys?: boolean;
  removeComments?: boolean;
}

/**
 * JSON validation outcome details.
 */
export interface JsonValidationResult {
  isValid: boolean;
  error?: string;
  lineNumber?: number;
  columnNumber?: number;
}

/**
 * Color value bundle across multiple color spaces.
 */
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

/**
 * Date formatting options.
 */
export interface DateConvertOptions {
  format?: string;
  timezone?: string;
  locale?: string;
}

/**
 * Date conversion output payload.
 */
export interface DateResult {
  timestamp: number;
  iso: string;
  local: string;
  utc: string;
  formatted?: string;
}

/**
 * Unit conversion input parameters.
 */
export interface UnitConvertOptions {
  fromUnit: string;
  toUnit: string;
  value: number;
  precision?: number;
}

/**
 * Unit conversion output payload.
 */
export interface UnitResult {
  value: number;
  unit: string;
  formatted: string;
}

/**
 * SVG optimization settings.
 */
export interface SvgOptimizeOptions {
  removeComments?: boolean;
  removeMetadata?: boolean;
  removeEditorsNSData?: boolean;
  cleanupAttrs?: boolean;
  minifyStyles?: boolean;
  convertStyleToAttrs?: boolean;
}

/**
 * SVG optimization result metrics.
 */
export interface SvgOptimizeResult {
  optimizedSvg: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

/**
 * Translation request options.
 */
export interface TranslateOptions {
  from: string;
  to: string;
  text: string;
}

/**
 * Translation result payload.
 */
export interface TranslateResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
}

/**
 * Regex test input parameters.
 */
export interface RegexTestOptions {
  pattern: string;
  flags?: string;
  testString: string;
}

/**
 * Regex test outcome metrics.
 */
export interface RegexTestResult {
  matches: RegExpMatchArray[];
  isMatch: boolean;
  matchCount: number;
  executionTime: number;
}

/**
 * Base props shared by UI components.
 */
export interface BaseComponentProps {
  loading?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark';
}

/**
 * Form field model used by form components.
 */
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

/**
 * Generic form data key-value map.
 */
export interface FormData {
  [key: string]: unknown;
}

/**
 * Form validation result with field errors.
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Base component event payload.
 */
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
