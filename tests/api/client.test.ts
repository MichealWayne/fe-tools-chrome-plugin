import { beforeEach, describe, expect, it, vi } from 'vitest';

const { axiosInstance } = vi.hoisted(() => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('axios', () => ({
  default: { create: vi.fn(() => axiosInstance) },
}));

import { ApiClient } from '@/api/client';
import api from '@/api';

describe('ApiClient retry policy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not retry a client response error', async () => {
    axiosInstance.get.mockRejectedValue({ response: { status: 404 }, message: 'Not Found' });
    const client = new ApiClient();

    await expect(client.get('/missing', undefined, { retryTimes: 1, retryDelay: 0 })).rejects.toMatchObject({
      message: 'Not Found',
    });
    expect(axiosInstance.get).toHaveBeenCalledTimes(1);
  });

  it('retries a server error with the configured count', async () => {
    axiosInstance.get.mockRejectedValue({ response: { status: 503 }, message: 'Unavailable' });
    const client = new ApiClient();

    await expect(client.get('/unstable', undefined, { retryTimes: 1, retryDelay: 0 })).rejects.toMatchObject({
      message: 'Unavailable',
    });
    expect(axiosInstance.get).toHaveBeenCalledTimes(2);
  });

  it('does not retry POST requests unless explicitly enabled', async () => {
    axiosInstance.post.mockRejectedValue({ response: { status: 503 }, message: 'Unavailable' });
    const client = new ApiClient();

    await expect(client.post('/submit')).rejects.toMatchObject({ message: 'Unavailable' });
    expect(axiosInstance.post).toHaveBeenCalledTimes(1);
  });
});

describe('ApiClient response contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes array payloads into the list field', async () => {
    axiosInstance.get.mockResolvedValue({
      data: [{ id: 'tool-1' }],
      status: 200,
      statusText: 'OK',
      config: { url: '/tools' },
    });
    const client = new ApiClient();

    await expect(client.get('/tools')).resolves.toEqual({
      success: true,
      message: 'OK',
      statusCode: 200,
      url: '/tools',
      list: [{ id: 'tool-1' }],
    });
  });

  it('normalizes object payloads into the data field', async () => {
    axiosInstance.get.mockResolvedValue({
      data: { id: 'tool-1' },
      status: 200,
      statusText: 'OK',
      config: { url: '/tool' },
    });
    const client = new ApiClient();

    await expect(client.get('/tool')).resolves.toEqual({
      success: true,
      message: 'OK',
      statusCode: 200,
      url: '/tool',
      data: { id: 'tool-1' },
    });
  });

  it('normalizes primitive payloads into the data field', async () => {
    axiosInstance.get.mockResolvedValue({
      data: 'pong',
      status: 200,
      statusText: 'OK',
      config: { url: '/ping' },
    });
    const client = new ApiClient();

    await expect(client.get('/ping')).resolves.toEqual({
      success: true,
      message: 'OK',
      statusCode: 200,
      url: '/ping',
      data: 'pong',
    });
  });

  it('returns a typed list response when the endpoint payload is an array', async () => {
    axiosInstance.get.mockResolvedValue({
      data: [{ id: 'tool-1' }],
      status: 200,
      statusText: 'OK',
      config: { url: '/tools' },
    });
    const client = new ApiClient();

    await expect(client.getList<{ id: string }>('/tools')).resolves.toMatchObject({
      list: [{ id: 'tool-1' }],
    });
  });

  it('rejects a list contract when the endpoint payload is not an array', async () => {
    axiosInstance.get.mockResolvedValue({
      data: { id: 'tool-1' },
      status: 200,
      statusText: 'OK',
      config: { url: '/tools' },
    });
    const client = new ApiClient();

    await expect(client.getList('/tools')).rejects.toThrow(
      'Expected a list response from /tools'
    );
  });

  it('returns a typed item response when the endpoint payload is not an array', async () => {
    axiosInstance.post.mockResolvedValue({
      data: { translated: 'hello' },
      status: 200,
      statusText: 'OK',
      config: { url: '/translate' },
    });
    const client = new ApiClient();

    await expect(client.postItem<{ translated: string }>('/translate')).resolves.toMatchObject({
      data: { translated: 'hello' },
    });
  });

  it('rejects an item contract when the endpoint payload is an array', async () => {
    axiosInstance.post.mockResolvedValue({
      data: [{ translated: 'hello' }],
      status: 200,
      statusText: 'OK',
      config: { url: '/translate' },
    });
    const client = new ApiClient();

    await expect(client.postItem('/translate')).rejects.toThrow(
      'Expected an item response from /translate'
    );
  });
});

describe('legacy API facade response contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts the utility reflection map as an object payload', async () => {
    const reflectionMap = {
      '1': { id: 1, name: 'Easing', query: 'Module.Easing', hash: '', kind: 2, flags: {} },
    };
    axiosInstance.get.mockResolvedValue({
      data: reflectionMap,
      status: 200,
      statusText: 'OK',
      config: { url: '/fe-tools/stable/data/yafReflectionMap.json' },
    });

    await expect(api.getUtilFuncs()).resolves.toMatchObject({ data: reflectionMap });
  });

  it('rejects a list endpoint that returns an object payload', async () => {
    axiosInstance.get.mockResolvedValue({
      data: { id: 'tool-1' },
      status: 200,
      statusText: 'OK',
      config: { url: '/tools' },
    });

    await expect(api.getFeTools()).rejects.toThrow('Expected a list response from');
  });

  it('preserves the configured GET transport for translation and validates its item response', async () => {
    axiosInstance.get.mockResolvedValue({
      data: [{ tgt: 'hello' }],
      status: 200,
      statusText: 'OK',
      config: { url: '/translate' },
    });

    await expect(api.handleTranslate({ doctype: 'json', type: 'AUTO', i: 'hello' })).rejects.toThrow(
      'Expected an item response from'
    );
    expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });
});
