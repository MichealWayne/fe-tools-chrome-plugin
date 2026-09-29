import { describe, expect, it, beforeEach } from 'vitest';
import { buildRequestPayload } from '@/components/PostMan/utils/request-builder';
import { replaceEnvironmentVariables } from '@/components/PostMan/utils/environment';
import {
  loadPostmanStorage,
  POSTMAN_STORAGE_VERSION,
  savePostmanStorage,
} from '@/components/PostMan/utils/storage';
import { redactRequest } from '@/components/PostMan/utils/redaction';
import type { PostmanRequestConfig } from '@/components/PostMan/types';
import { normalizeEnvironment, normalizeRequest } from '@/components/PostMan/utils/request-model';
import { parseRequestUrl, serializeRequestUrl } from '@/components/PostMan/utils/url-params';
import { validateRequest } from '@/components/PostMan/utils/validation';
import { generateCurl, parseCurl } from '@/components/PostMan/utils/curl';

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

  it('excludes disabled request entries', () => {
    const request = createRequest({
      headers: [{ key: 'x-disabled', value: 'secret', enabled: false }],
      body: {
        type: 'x-www-form-urlencoded',
        urlencoded: [{ key: 'a', value: 'b', enabled: false }],
      },
    });
    const payload = buildRequestPayload(request, resolveValue);
    expect(payload.headers).not.toHaveProperty('x-disabled');
    expect(String(payload.data)).toBe('');
  });
});

describe('postman normalized request model', () => {
  it('converts legacy entries without losing values', () => {
    const request = normalizeRequest(createRequest());
    expect(request.headers[0]).toMatchObject({ key: 'x-token', value: '{{token}}', enabled: true });
    expect(request.headers[0].id).toBeTruthy();
    expect(request.settings?.timeout).toBe(30000);

    const environment = normalizeEnvironment({
      name: 'Dev',
      variables: [{ key: 'token', value: 'x' }],
    });
    expect(environment.variables[0]).toMatchObject({ enabled: true, secret: false });
  });
});

describe('postman URL parameters', () => {
  it('parses repeated query keys in order', () => {
    const parsed = parseRequestUrl('https://api.test/items?a=1&a=2#result');
    expect(parsed?.params.map(({ key, value }) => [key, value])).toEqual([
      ['a', '1'],
      ['a', '2'],
    ]);
  });

  it('serializes enabled parameters and preserves fragments', () => {
    expect(
      serializeRequestUrl('https://api.test/items?old=1#result', [
        { key: 'a', value: '1' },
        { key: 'skip', value: '2', enabled: false },
      ])
    ).toBe('https://api.test/items?a=1#result');
  });

  it('does not rewrite incomplete input', () => {
    expect(parseRequestUrl('https://')).toBeNull();
    expect(serializeRequestUrl('api.test', [])).toBeNull();
  });
});

describe('postman preflight validation', () => {
  it('reports invalid URL, JSON, and missing environment variables', () => {
    const issues = validateRequest(
      createRequest({ url: 'not-a-url/{{host}}', body: { type: 'json', json: '{invalid' } }),
      []
    );
    expect(issues.map(issue => issue.code)).toEqual([
      'unresolved-variable',
      'invalid-url',
      'invalid-json',
    ]);
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
    expect(JSON.parse(localStorage.getItem('postman-data') || '{}').version).toBe(
      POSTMAN_STORAGE_VERSION
    );
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

  it('migrates valid legacy records and retains a snapshot', () => {
    localStorage.setItem(
      'postman-data',
      JSON.stringify({
        environments: [{ name: 'Dev', variables: [{ key: 'host', value: 'api.test' }] }],
        currentEnvironment: 'Dev',
        requestHistory: [{ method: 'GET', url: 'https://api.test', headers: {}, timestamp: 1 }],
      })
    );
    expect(loadPostmanStorage().requestHistory).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('postman-data') || '{}').legacySnapshot).toContain(
      'api.test'
    );
  });

  it('does not overwrite unknown newer storage', () => {
    const raw = JSON.stringify({ version: POSTMAN_STORAGE_VERSION + 1, future: true });
    localStorage.setItem('postman-data', raw);
    expect(loadPostmanStorage().storageError).toBe('newer-version');
    expect(
      savePostmanStorage({ environments: [], currentEnvironment: '', requestHistory: [] })
    ).toBe(false);
    expect(localStorage.getItem('postman-data')).toBe(raw);
  });

  it('redacts request authentication and credential headers', () => {
    const safe = redactRequest(
      createRequest({
        headers: [{ key: 'Authorization', value: 'Bearer header-secret' }],
        auth: { type: 'bearer', token: 'auth-secret' },
      })
    );
    expect(safe.redacted).toBe(true);
    expect(safe.request.headers).toEqual([]);
    expect(safe.request.auth.token).toBe('');
  });
});

describe('postman cURL interoperability', () => {
  it('imports a supported single request without executing it', () => {
    const result = parseCurl(
      "curl -X POST 'https://api.test/items?a=1' -H 'Content-Type: application/json' --data-raw '{\"ok\":true}'"
    );
    expect(result.error).toBeUndefined();
    expect(result.request).toMatchObject({ method: 'POST', url: 'https://api.test/items?a=1' });
    expect(result.request?.body).toEqual(expect.objectContaining({ type: 'json' }));
  });

  it('rejects shell operators and file reads', () => {
    expect(parseCurl('curl https://api.test; whoami').error).toBe('unsafe-shell-syntax');
    expect(parseCurl("curl https://api.test --data '@secret.txt'").error).toBe('file-read');
  });

  it('generates shell-safe cURL without secrets', () => {
    const output = generateCurl(
      createRequest({
        url: "https://api.test/item's",
        headers: [{ key: 'Authorization', value: 'Bearer secret' }],
        auth: { type: 'bearer', token: 'secret' },
      })
    );
    expect(output).toContain(`item'\"'\"'s`);
    expect(output).not.toContain('secret');
  });
});
