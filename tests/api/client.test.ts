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
