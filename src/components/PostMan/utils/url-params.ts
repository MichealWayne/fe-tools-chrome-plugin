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

export const parseRequestUrl = (value: string): ParsedRequestUrl | null => {
  if (!isSupportedRequestUrl(value)) return null;
  const url = new URL(value);
  return {
    url: value,
    params: normalizeEntries(
      Array.from(url.searchParams.entries()).map(([key, paramValue]) => ({
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
  if (!isSupportedRequestUrl(value)) return null;
  const url = new URL(value);
  url.search = '';
  params.forEach(param => {
    if (param.enabled !== false && param.key) url.searchParams.append(param.key, param.value);
  });
  return url.toString();
};
