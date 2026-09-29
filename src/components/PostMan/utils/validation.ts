import type { EnvironmentVariable, PostmanRequestConfig } from '../types';
import { isSupportedRequestUrl } from './url-params';
import { replaceEnvironmentVariables } from './environment';

export type RequestValidationIssue = {
  field: 'url' | 'body' | 'environment';
  code: 'invalid-url' | 'invalid-json' | 'unresolved-variable';
  detail?: string;
};

const PLACEHOLDER_PATTERN = /{{\s*([^{}]+?)\s*}}/g;

export const findUnresolvedVariables = (
  request: PostmanRequestConfig,
  variables: EnvironmentVariable[]
): string[] => {
  const available = new Set(
    variables
      .filter(variable => variable.enabled !== false && variable.key && variable.value)
      .map(variable => variable.key)
  );
  const values = [
    request.url,
    ...(request.queryParams || [])
      .filter(item => item.enabled !== false && item.key)
      .map(item => item.value),
    ...request.headers
      .filter(item => item.enabled !== false && item.key && item.value)
      .map(item => item.value),
  ];
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (request.body.type === 'json') values.push(request.body.json || '');
    else if (request.body.type === 'raw') values.push(request.body.raw || '');
    else if (request.body.type === 'form-data') {
      values.push(
        ...(request.body.formData || [])
          .filter(item => item.enabled !== false && item.key && item.value)
          .map(item => item.value)
      );
    } else if (request.body.type === 'x-www-form-urlencoded') {
      values.push(
        ...(request.body.urlencoded || [])
          .filter(item => item.enabled !== false && item.key && item.value)
          .map(item => item.value)
      );
    }
  }
  if (request.auth.type === 'bearer' && request.auth.token) values.push(request.auth.token);
  else if (request.auth.type === 'basic' && request.auth.username && request.auth.password) {
    values.push(request.auth.username, request.auth.password);
  } else if (request.auth.type === 'api-key' && request.auth.key && request.auth.value) {
    values.push(request.auth.value);
  }
  const missing = new Set<string>();
  values.forEach(value => {
    for (const match of value.matchAll(PLACEHOLDER_PATTERN)) {
      if (!available.has(match[1])) missing.add(match[1]);
    }
  });
  return [...missing];
};

export const validateRequest = (
  request: PostmanRequestConfig,
  variables: EnvironmentVariable[] = []
): RequestValidationIssue[] => {
  const issues: RequestValidationIssue[] = [];
  const missing = findUnresolvedVariables(request, variables);
  if (missing.length) {
    issues.push({ field: 'environment', code: 'unresolved-variable', detail: missing.join(', ') });
  }
  const resolve = (value: string) => replaceEnvironmentVariables(value, variables);
  if (!isSupportedRequestUrl(resolve(request.url).trim()))
    issues.push({ field: 'url', code: 'invalid-url' });
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body.type === 'json') {
    try {
      const resolvedJson = resolve(request.body.json || '');
      if (resolvedJson.trim() && !/{{\s*[^{}]+?\s*}}/.test(resolvedJson)) JSON.parse(resolvedJson);
    } catch {
      issues.push({ field: 'body', code: 'invalid-json' });
    }
  }
  return issues;
};
