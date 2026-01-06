import type { HttpMethod } from '@/types/components';

export interface HeaderEntry {
  key: string;
  value: string;
}

export interface FormDataEntry {
  key: string;
  value: string;
}

export type RequestBodyType = 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw';

export interface RequestBodyData {
  type: RequestBodyType;
  json?: string;
  formData?: FormDataEntry[];
  urlencoded?: FormDataEntry[];
  raw?: string;
}

export interface AuthConfig {
  type: 'none' | 'bearer' | 'basic' | 'api-key';
  token?: string;
  username?: string;
  password?: string;
  key?: string;
  value?: string;
  addTo?: 'header' | 'query';
}

export interface PostmanRequestConfig {
  method: HttpMethod;
  url: string;
  headers: HeaderEntry[];
  body: RequestBodyData;
  auth: AuthConfig;
}

export interface PostmanResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  responseTime: number;
  size: number;
}

export interface PostmanHistoryItem {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  timestamp: number;
  status?: number;
  responseTime?: number;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  description?: string;
}

export interface PostmanEnvironment {
  name: string;
  variables: EnvironmentVariable[];
}
