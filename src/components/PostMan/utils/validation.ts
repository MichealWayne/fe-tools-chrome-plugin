import type { EnvironmentVariable, PostmanRequestConfig } from '../types';
import { isSupportedRequestUrl } from './url-params';

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
      .filter(variable => variable.enabled !== false && variable.key)
      .map(variable => variable.key)
  );
  const values = [
    request.url,
    ...(request.queryParams || []).filter(item => item.enabled !== false).map(item => item.value),
    ...request.headers.filter(item => item.enabled !== false).map(item => item.value),
    request.body.json || '',
    request.body.raw || '',
    ...(request.body.formData || []).filter(item => item.enabled !== false).map(item => item.value),
    ...(request.body.urlencoded || [])
      .filter(item => item.enabled !== false)
      .map(item => item.value),
    request.auth.token || '',
    request.auth.value || '',
  ];
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
  if (!isSupportedRequestUrl(request.url.trim()))
    issues.push({ field: 'url', code: 'invalid-url' });
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body.type === 'json') {
    try {
      if (request.body.json?.trim()) JSON.parse(request.body.json);
    } catch {
      issues.push({ field: 'body', code: 'invalid-json' });
    }
  }
  const missing = findUnresolvedVariables(request, variables);
  if (missing.length) {
    issues.push({ field: 'environment', code: 'unresolved-variable', detail: missing.join(', ') });
  }
  return issues;
};
