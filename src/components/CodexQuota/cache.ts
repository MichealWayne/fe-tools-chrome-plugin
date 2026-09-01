import { parseCodexQuotaSnapshot } from './normalizer';
import type { CodexQuotaFreshness, CodexQuotaSnapshot } from './types';

export const CODEX_QUOTA_CACHE_KEY = 'codex-quota-snapshot-v1';
export const CODEX_QUOTA_FRESH_MS = 10 * 60 * 1000;

const storageAvailable = () => typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);

export const getCodexQuotaFreshness = (
  snapshot: CodexQuotaSnapshot | null,
  now = Date.now()
): CodexQuotaFreshness => {
  if (!snapshot) return 'missing';
  return now - snapshot.fetchedAt <= CODEX_QUOTA_FRESH_MS ? 'fresh' : 'stale';
};

export const readCodexQuotaCache = async (): Promise<CodexQuotaSnapshot | null> => {
  if (!storageAvailable()) return null;
  const values = await chrome.storage.local.get(CODEX_QUOTA_CACHE_KEY);
  return parseCodexQuotaSnapshot(values[CODEX_QUOTA_CACHE_KEY]);
};

export const writeCodexQuotaCache = async (snapshot: CodexQuotaSnapshot): Promise<void> => {
  const sanitized = parseCodexQuotaSnapshot(snapshot);
  if (!sanitized || !storageAvailable()) return;
  await chrome.storage.local.set({ [CODEX_QUOTA_CACHE_KEY]: sanitized });
};

export const clearCodexQuotaCache = async (): Promise<void> => {
  if (!storageAvailable()) return;
  await chrome.storage.local.remove(CODEX_QUOTA_CACHE_KEY);
};
