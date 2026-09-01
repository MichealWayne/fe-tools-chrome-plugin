import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CODEX_QUOTA_CACHE_KEY,
  clearCodexQuotaCache,
  readCodexQuotaCache,
  writeCodexQuotaCache,
} from '@/components/CodexQuota/cache';

const snapshot = {
  version: 1 as const,
  fetchedAt: 123456,
  windows: [
    {
      id: 'weekly',
      kind: 'weekly' as const,
      usedPercent: 25,
      remainingPercent: 75,
      durationMinutes: 10080,
      resetAt: 1788000000000,
    },
  ],
};

describe('Codex quota cache', () => {
  const get = vi.fn();
  const set = vi.fn();
  const remove = vi.fn();

  beforeEach(() => {
    get.mockReset();
    set.mockReset();
    remove.mockReset();
    (globalThis.chrome as any).storage = { local: { get, set, remove } };
  });

  it('reads and writes only the versioned sanitized snapshot', async () => {
    get.mockResolvedValue({ [CODEX_QUOTA_CACHE_KEY]: snapshot });
    expect(await readCodexQuotaCache()).toEqual(snapshot);
    await writeCodexQuotaCache(snapshot);
    expect(set).toHaveBeenCalledWith({ [CODEX_QUOTA_CACHE_KEY]: snapshot });
    expect(JSON.stringify(set.mock.calls)).not.toMatch(/email|account|token|cookie/i);
  });

  it('rejects incompatible cached values and supports local clearing', async () => {
    get.mockResolvedValue({ [CODEX_QUOTA_CACHE_KEY]: { ...snapshot, version: 2 } });
    expect(await readCodexQuotaCache()).toBeNull();
    await clearCodexQuotaCache();
    expect(remove).toHaveBeenCalledWith(CODEX_QUOTA_CACHE_KEY);
  });
});
