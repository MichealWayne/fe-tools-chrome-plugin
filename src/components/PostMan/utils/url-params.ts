import type { QueryParameterEntry } from '../types';
import { normalizeEntries } from './request-model';

export interface ParsedRequestUrl {
  url: string;
  params: QueryParameterEntry[];
}

export const isSupportedRequestUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const hasTemplatedBaseUrl = (value: string): boolean =>
  /^{{\s*[^{}]+\s*}}(?=\/|[?#]|$)/.test(value);

export const parseRequestUrl = (value: string): ParsedRequestUrl | null => {
  if (!isSupportedRequestUrl(value) && !hasTemplatedBaseUrl(value)) return null;
  const params = hasTemplatedBaseUrl(value)
    ? new URLSearchParams(value.split('#')[0].split('?')[1] || '')
    : new URL(value).searchParams;
  return {
    url: value,
    params: normalizeEntries(
      Array.from(params.entries()).map(([key, paramValue]) => ({
        key,
        value: paramValue,
      }))
    ),
  };
};

export const serializeRequestUrl = (
  value: string,
  params: QueryParameterEntry[]
): string | null => {
  if (hasTemplatedBaseUrl(value)) {
    const fragmentIndex = value.indexOf('#');
    const beforeFragment = fragmentIndex < 0 ? value : value.slice(0, fragmentIndex);
    const fragment = fragmentIndex < 0 ? '' : value.slice(fragmentIndex);
    const base = beforeFragment.split('?')[0];
    const query = new URLSearchParams();
    params.forEach(param => {
      if (param.enabled !== false && param.key) query.append(param.key, param.value);
    });
    return `${base}${query.toString() ? `?${query}` : ''}${fragment}`;
  }
  if (!isSupportedRequestUrl(value)) return null;
  const url = new URL(value);
  url.search = '';
  params.forEach(param => {
    if (param.enabled !== false && param.key) url.searchParams.append(param.key, param.value);
  });
  return url.toString();
};
