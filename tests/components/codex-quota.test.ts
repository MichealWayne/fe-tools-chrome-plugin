import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCodexQuotaFreshness } from '@/components/CodexQuota/cache';
import {
  parseCodexQuotaResponse,
  parseCodexQuotaSnapshot,
} from '@/components/CodexQuota/normalizer';

type Runtime = {
  ENDPOINT: string;
  fetchQuota: (fetchImpl: typeof fetch, options?: { timeoutMs?: number }) => Promise<unknown>;
  normalizeQuotaResponse: (input: unknown, fetchedAt: number) => any;
};

let runtime: Runtime;

beforeAll(async () => {
  await import('../../public/scripts/codex-quota-runtime.js');
  runtime = (globalThis as typeof globalThis & { CodexQuotaRuntime: Runtime }).CodexQuotaRuntime;
});

const windowFixture = (usedPercent: number, seconds: number, resetAt = 1788000000) => ({
  used_percent: usedPercent,
  limit_window_seconds: seconds,
  reset_at: resetAt,
});

describe('Codex quota normalizer', () => {
  it('normalizes five-hour and weekly windows without retaining identity fields', () => {
    const result = runtime.normalizeQuotaResponse(
      {
        email: 'private@example.com',
        account_id: 'private-account',
        access_token: 'private-token',
        rate_limit: {
          primary_window: windowFixture(24, 18000),
          secondary_window: windowFixture(58, 604800),
        },
      },
      123456
    );

    expect(result.ok).toBe(true);
    expect(result.snapshot.windows).toEqual([
      expect.objectContaining({ kind: 'five-hour', remainingPercent: 76, durationMinutes: 300 }),
      expect.objectContaining({ kind: 'weekly', remainingPercent: 42, durationMinutes: 10080 }),
    ]);
    expect(JSON.stringify(result)).not.toContain('private');
    expect(parseCodexQuotaResponse(result)).toEqual(result);
  });

  it('keeps an observed single or additional window and never synthesizes a missing window', () => {
    const weeklyOnly = runtime.normalizeQuotaResponse(
      { rate_limits: { primary: windowFixture(10, 604800) } },
      123456
    );
    const additional = runtime.normalizeQuotaResponse(
      {
        rate_limit: { primary_window: windowFixture(10, 3600) },
        additional_rate_limits: [{ window: windowFixture(20, 7200) }],
      },
      123456
    );

    expect(weeklyOnly.snapshot.windows).toHaveLength(1);
    expect(weeklyOnly.snapshot.windows[0].kind).toBe('weekly');
    expect(additional.snapshot.windows.every((item: any) => item.kind === 'additional')).toBe(true);
  });

  it('omits malformed windows and returns explicit empty or incompatible errors', () => {
    expect(runtime.normalizeQuotaResponse({ anything: true }, 1)).toEqual({
      ok: false,
      error: 'incompatible_response',
    });
    expect(
      runtime.normalizeQuotaResponse(
        { rate_limit: { primary_window: windowFixture(Number.NaN, 18000) } },
        1
      )
    ).toEqual({ ok: false, error: 'empty_data' });
  });

  it('rejects unversioned or identity-bearing objects at the cache boundary', () => {
    const valid = runtime.normalizeQuotaResponse(
      { rate_limit: { primary_window: windowFixture(10, 18000) } },
      Date.now()
    ).snapshot;
    expect(parseCodexQuotaSnapshot(valid)).toEqual(valid);
    expect(parseCodexQuotaSnapshot({ ...valid, version: 2 })).toBeNull();
    expect(
      parseCodexQuotaResponse({ ok: true, snapshot: { email: 'private@example.com' } })
    ).toEqual({
      ok: false,
      error: 'incompatible_response',
    });
  });
});

describe('Codex quota transport and freshness', () => {
  beforeEach(() => vi.useRealTimers());

  it('uses only the fixed endpoint and GET credentialed request', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ rate_limit: { primary_window: windowFixture(25, 18000) } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
    );

    const result = await runtime.fetchQuota(fetchMock as typeof fetch);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(runtime.ENDPOINT);
    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ method: 'GET', credentials: 'include' })
    );
    expect(result).toEqual(expect.objectContaining({ ok: true }));
  });

  it.each([
    [401, 'signed_out'],
    [403, 'forbidden'],
    [429, 'upstream_rejection'],
  ])('maps HTTP %s to %s without returning a response body', async (status, error) => {
    const result = await runtime.fetchQuota(
      vi.fn(async () => new Response('sensitive-body', { status })) as typeof fetch
    );
    expect(result).toEqual({ ok: false, error });
  });

  it('classifies cache freshness at the ten-minute boundary', () => {
    const now = 1_000_000;
    const snapshot = runtime.normalizeQuotaResponse(
      { rate_limit: { primary_window: windowFixture(20, 18000) } },
      now
    ).snapshot;
    expect(getCodexQuotaFreshness(snapshot, now + 600_000)).toBe('fresh');
    expect(getCodexQuotaFreshness(snapshot, now + 600_001)).toBe('stale');
    expect(getCodexQuotaFreshness(null, now)).toBe('missing');
  });
});
