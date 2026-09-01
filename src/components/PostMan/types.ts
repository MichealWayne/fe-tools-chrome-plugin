import type { HttpMethod } from '@/types/components';

export interface KeyValueEntry {
  id?: string;
  enabled?: boolean;
  key: string;
  value: string;
  description?: string;
}

export type HeaderEntry = KeyValueEntry;
export type FormDataEntry = KeyValueEntry;
export type QueryParameterEntry = KeyValueEntry;

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
  queryParams?: QueryParameterEntry[];
  headers: HeaderEntry[];
  body: RequestBodyData;
  auth: AuthConfig;
  settings?: RequestSettings;
  environment?: string;
}

export interface RequestSettings {
  timeout: number;
}

export interface PostmanResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  data: unknown;
  responseTime: number;
  size: number;
}

export interface PostmanHistoryItem {
  id?: string;
  name?: string;
  favorite?: boolean;
  request?: PostmanRequestConfig;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  environment?: string;
  timestamp: number;
  status?: number;
  responseTime?: number;
  redacted?: boolean;
}

export interface EnvironmentVariable extends KeyValueEntry {
  description?: string;
  secret?: boolean;
}

export interface PostmanEnvironment {
  name: string;
  variables: EnvironmentVariable[];
}

export type RequestExecutionState =
  | { type: 'idle' }
  | { type: 'pending'; startedAt: number }
  | { type: 'received'; response: PostmanResponseData }
  | { type: 'cancelled' }
  | { type: 'timeout'; timeout: number }
  | { type: 'network-error'; message: string };

export interface SavedRequest {
  id: string;
  name: string;
  request: PostmanRequestConfig;
  createdAt: number;
  updatedAt: number;
  redacted?: boolean;
}

export interface PostmanPreferences {
  historyLimit: number;
  historyOpen?: boolean;
}

export const DEFAULT_REQUEST_SETTINGS: RequestSettings = { timeout: 30000 };
export const DEFAULT_POSTMAN_PREFERENCES: PostmanPreferences = { historyLimit: 50 };
