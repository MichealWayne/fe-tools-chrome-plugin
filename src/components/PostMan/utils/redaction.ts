import type { PostmanRequestConfig } from '../types';
import { cloneRequest } from './request-model';

const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'proxy-authorization',
  'x-api-key',
]);

export const isSensitiveHeader = (name: string): boolean =>
  SENSITIVE_HEADER_NAMES.has(name.trim().toLowerCase());

export const redactHeaderRecord = (headers: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(headers).filter(([key]) => !isSensitiveHeader(key)));

export const redactRequest = (
  request: PostmanRequestConfig
): { request: PostmanRequestConfig; redacted: boolean } => {
  const safe = cloneRequest(request);
  let redacted = false;
  safe.headers = safe.headers.filter(header => {
    if (!isSensitiveHeader(header.key)) return true;
    redacted = true;
    return false;
  });
  if (safe.auth.type === 'bearer' && safe.auth.token) {
    safe.auth.token = '';
    redacted = true;
  } else if (safe.auth.type === 'basic' && safe.auth.password) {
    safe.auth.password = '';
    redacted = true;
  } else if (safe.auth.type === 'api-key' && safe.auth.value) {
    safe.auth.value = '';
    redacted = true;
  }
  return { request: safe, redacted };
};
