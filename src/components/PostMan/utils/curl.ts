import type { HttpMethod } from '@/types/components';
import type { PostmanRequestConfig } from '../types';
import { normalizeRequest } from './request-model';
import { redactRequest } from './redaction';

export type CurlParseResult = {
  request: PostmanRequestConfig | null;
  warnings: string[];
  error?: string;
};

const tokenize = (source: string): string[] => {
  const tokens: string[] = [];
  let token = '';
  let quote = '';
  let escaped = false;
  for (const char of source.trim()) {
    if (escaped) {
      token += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (quote) {
      if (char === quote) quote = '';
      else token += char;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (/\s/.test(char)) {
      if (token) tokens.push(token);
      token = '';
    } else if (';&|`$<>'.includes(char)) {
      throw new Error('unsafe-shell-syntax');
    } else token += char;
  }
  if (quote || escaped) throw new Error('unterminated-quote');
  if (token) tokens.push(token);
  return tokens;
};

export const parseCurl = (source: string): CurlParseResult => {
  let tokens: string[];
  try {
    tokens = tokenize(source);
  } catch (error) {
    return { request: null, warnings: [], error: (error as Error).message };
  }
  if (tokens.shift()?.toLowerCase() !== 'curl') {
    return { request: null, warnings: [], error: 'not-curl' };
  }
  const request = normalizeRequest({
    method: 'GET',
    url: '',
    headers: [],
    body: { type: 'none' },
    auth: { type: 'none' },
  });
  const warnings: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const next = () => tokens[++index] || '';
    if (token === '-X' || token === '--request')
      request.method = next().toUpperCase() as HttpMethod;
    else if (token === '-H' || token === '--header') {
      const header = next();
      const separator = header.indexOf(':');
      if (separator > 0) {
        request.headers.push({
          key: header.slice(0, separator).trim(),
          value: header.slice(separator + 1).trim(),
        });
      }
    } else if (['-d', '--data', '--data-raw', '--data-binary'].includes(token)) {
      const data = next();
      if (data.startsWith('@')) return { request: null, warnings, error: 'file-read' };
      request.body = data.trim().startsWith('{')
        ? { type: 'json', json: data }
        : { type: 'raw', raw: data };
      if (request.method === 'GET') request.method = 'POST';
    } else if (token === '--data-urlencode') {
      const [key, ...value] = next().split('=');
      request.body.type = 'x-www-form-urlencoded';
      request.body.urlencoded = [
        ...(request.body.urlencoded || []),
        { key, value: value.join('='), enabled: true },
      ];
      if (request.method === 'GET') request.method = 'POST';
    } else if (token === '-F' || token === '--form') {
      const [key, ...value] = next().split('=');
      if (value.join('=').startsWith('@')) return { request: null, warnings, error: 'file-read' };
      request.body.type = 'form-data';
      request.body.formData = [
        ...(request.body.formData || []),
        { key, value: value.join('='), enabled: true },
      ];
      if (request.method === 'GET') request.method = 'POST';
    } else if (token === '-u' || token === '--user') {
      const [username, ...password] = next().split(':');
      request.auth = { type: 'basic', username, password: password.join(':') };
    } else if (token === '--url') request.url = next();
    else if (token === '--compressed' || token === '-L' || token === '--location') continue;
    else if (token.startsWith('-')) warnings.push(token);
    else if (!request.url) request.url = token;
    else return { request: null, warnings, error: 'multiple-commands' };
  }
  if (!request.url) return { request: null, warnings, error: 'missing-url' };
  return { request: normalizeRequest(request), warnings };
};

const SINGLE_QUOTE_ESCAPE = String.fromCharCode(39, 34, 39, 34, 39);
const shellQuote = (value: string): string => `'${value.replace(/'/g, SINGLE_QUOTE_ESCAPE)}'`;

export const generateCurl = (request: PostmanRequestConfig): string => {
  const safe = redactRequest(request).request;
  const parts = ['curl', '-X', safe.method, shellQuote(safe.url)];
  safe.headers
    .filter(header => header.enabled !== false && header.key)
    .forEach(header => parts.push('-H', shellQuote(`${header.key}: ${header.value}`)));
  if (safe.auth.type === 'basic' && safe.auth.username) {
    parts.push('-u', shellQuote(`${safe.auth.username}:`));
  }
  const body =
    safe.body.type === 'json' ? safe.body.json : safe.body.type === 'raw' ? safe.body.raw : '';
  if (body) parts.push('--data-raw', shellQuote(body));
  if (safe.body.type === 'x-www-form-urlencoded') {
    (safe.body.urlencoded || [])
      .filter(entry => entry.enabled !== false && entry.key)
      .forEach(entry => parts.push('--data-urlencode', shellQuote(`${entry.key}=${entry.value}`)));
  }
  if (safe.body.type === 'form-data') {
    (safe.body.formData || [])
      .filter(entry => entry.enabled !== false && entry.key)
      .forEach(entry => parts.push('--form', shellQuote(`${entry.key}=${entry.value}`)));
  }
  return parts.join(' ');
};
