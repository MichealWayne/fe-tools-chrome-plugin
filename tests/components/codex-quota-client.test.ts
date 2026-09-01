import { beforeEach, describe, expect, it, vi } from 'vitest';

const validSnapshot = {
  version: 1,
  fetchedAt: 123456,
  windows: [
    {
      id: 'five-hour',
      kind: 'five-hour',
      usedPercent: 10,
      remainingPercent: 90,
      durationMinutes: 300,
      resetAt: 1788000000000,
    },
  ],
};

describe('Codex quota client', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('coalesces concurrent refreshes into one runtime request', async () => {
    let reply: ((value: unknown) => void) | undefined;
    const sendMessage = vi.fn((_message, callback) => {
      reply = callback;
    });
    (globalThis.chrome.runtime as any).sendMessage = sendMessage;
    (globalThis.chrome.runtime as any).lastError = undefined;
    const { requestCodexQuota } = await import('@/components/CodexQuota/client');

    const first = requestCodexQuota(true);
    const second = requestCodexQuota(true);
    expect(sendMessage).toHaveBeenCalledOnce();
    expect(sendMessage).toHaveBeenCalledWith({ action: 'getCodexQuota' }, expect.any(Function));
    reply?.({ ok: true, snapshot: validSnapshot });

    await expect(first).resolves.toEqual({ ok: true, snapshot: validSnapshot });
    await expect(second).resolves.toEqual({ ok: true, snapshot: validSnapshot });
  });

  it('maps unavailable runtime errors to a non-sensitive category', async () => {
    const sendMessage = vi.fn((_message, callback) => {
      callback(undefined);
    });
    (globalThis.chrome.runtime as any).sendMessage = sendMessage;
    (globalThis.chrome.runtime as any).lastError = { message: 'sensitive implementation detail' };
    const { requestCodexQuota } = await import('@/components/CodexQuota/client');

    await expect(requestCodexQuota(true)).resolves.toEqual({ ok: false, error: 'unavailable' });
  });
});
