import { describe, expect, it, beforeEach } from 'vitest';
import { buildRequestPayload } from '@/components/PostMan/utils/request-builder';
import { replaceEnvironmentVariables } from '@/components/PostMan/utils/environment';
import { loadPostmanStorage, savePostmanStorage } from '@/components/PostMan/utils/storage';
import type { PostmanRequestConfig } from '@/components/PostMan/types';

const createRequest = (overrides: Partial<PostmanRequestConfig> = {}): PostmanRequestConfig => ({
  method: 'POST',
  url: 'https://api.test/{{version}}/resource',
  headers: [{ key: 'x-token', value: '{{token}}' }],
  body: { type: 'json', json: '{"ok":true}' },
  auth: { type: 'none' },
  ...overrides,
});

describe('postman request utilities', () => {
  const resolveValue = (value: string) =>
    value.replace('{{version}}', 'v1').replace('{{token}}', 'abc123');

  it('builds payload with json body and headers', () => {
    const request = createRequest();
    const payload = buildRequestPayload(request, resolveValue);

    expect(payload.url).toBe('https://api.test/v1/resource');
    expect(payload.headers['x-token']).toBe('abc123');
    expect(payload.headers['Content-Type']).toBe('application/json');
    expect(payload.data).toEqual({ ok: true });
  });

  it('appends api-key to query string', () => {
    const request = createRequest({
      auth: { type: 'api-key', key: 'apiKey', value: '{{token}}', addTo: 'query' },
    });
    const payload = buildRequestPayload(request, resolveValue);

    expect(payload.url).toBe('https://api.test/v1/resource?apiKey=abc123');
  });

  it('returns form-data payload', () => {
    const request = createRequest({
      body: {
        type: 'form-data',
        formData: [{ key: 'file', value: 'data' }],
      },
    });
    const payload = buildRequestPayload(request, resolveValue);

    expect(payload.data).toBeInstanceOf(FormData);
  });

  it('skips body for GET requests', () => {
    const request = createRequest({ method: 'GET' });
    const payload = buildRequestPayload(request, resolveValue);

    expect(payload.data).toBeUndefined();
  });
});

describe('postman environment variable replacement', () => {
  it('treats variable names and values as literal text', () => {
    const result = replaceEnvironmentVariables('https://api.test/{{api.v1}}/{{token}}', [
      { key: 'api.v1', value: 'v1' },
      { key: 'token', value: 'a$&b' },
    ]);

    expect(result).toBe('https://api.test/v1/a$&b');
  });

  it('does not throw when a variable name includes regexp syntax', () => {
    expect(replaceEnvironmentVariables('{{[token]}}', [{ key: '[token]', value: 'abc' }])).toBe(
      'abc'
    );
  });
});

describe('postman storage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips storage state', () => {
    savePostmanStorage({
      environments: [{ name: 'Prod', variables: [] }],
      currentEnvironment: 'Prod',
      requestHistory: [],
    });

    const loaded = loadPostmanStorage();
    expect(loaded.currentEnvironment).toBe('Prod');
    expect(loaded.environments[0].name).toBe('Prod');
  });

  it('does not persist sensitive request headers in history', () => {
    savePostmanStorage({
      environments: [],
      currentEnvironment: '',
      requestHistory: [
        {
          method: 'GET',
          url: 'https://api.test',
          headers: { Authorization: 'Bearer secret', Accept: 'application/json' },
          timestamp: Date.now(),
        },
      ],
    });

    expect(localStorage.getItem('postman-data')).not.toContain('Bearer secret');
    expect(loadPostmanStorage().requestHistory[0].headers).toEqual({ Accept: 'application/json' });
  });

  it('handles invalid storage data', () => {
    localStorage.setItem('postman-data', '{invalid');

    const loaded = loadPostmanStorage();
    expect(loaded.environments).toEqual([]);
    expect(loaded.requestHistory).toEqual([]);
  });
});
