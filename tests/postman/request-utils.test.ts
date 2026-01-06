import { describe, expect, it, beforeEach } from 'vitest';
import { buildRequestPayload } from '@/components/PostMan/utils/request-builder';
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

  it('handles invalid storage data', () => {
    localStorage.setItem('postman-data', '{invalid');

    const loaded = loadPostmanStorage();
    expect(loaded.environments).toEqual([]);
    expect(loaded.requestHistory).toEqual([]);
  });
});
