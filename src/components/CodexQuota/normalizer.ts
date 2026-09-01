import type {
  CodexQuotaDiagnostic,
  CodexQuotaResponse,
  CodexQuotaSnapshot,
  CodexQuotaWindow,
} from './types';

export const CODEX_QUOTA_CACHE_VERSION = 1 as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isWindow = (value: unknown): value is CodexQuotaWindow => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    ['five-hour', 'weekly', 'additional'].includes(String(value.kind)) &&
    typeof value.usedPercent === 'number' &&
    value.usedPercent >= 0 &&
    value.usedPercent <= 100 &&
    typeof value.remainingPercent === 'number' &&
    value.remainingPercent >= 0 &&
    value.remainingPercent <= 100 &&
    typeof value.durationMinutes === 'number' &&
    value.durationMinutes > 0 &&
    typeof value.resetAt === 'number' &&
    Number.isFinite(value.resetAt)
  );
};

const parseDiagnostic = (value: unknown): CodexQuotaDiagnostic | undefined => {
  if (!isRecord(value)) return undefined;
  const activeTabCount = value.activeTabCount;
  const candidateTabCount = value.candidateTabCount;
  if (
    typeof value.directResult !== 'string' ||
    typeof activeTabCount !== 'number' ||
    !Number.isInteger(activeTabCount) ||
    activeTabCount < 0 ||
    typeof candidateTabCount !== 'number' ||
    !Number.isInteger(candidateTabCount) ||
    candidateTabCount < 0 ||
    !Array.isArray(value.attempts) ||
    value.attempts.length > 8
  ) {
    return undefined;
  }
  const attempts = value.attempts.filter(
    item =>
      isRecord(item) &&
      (item.world === 'isolated' || item.world === 'main') &&
      typeof item.result === 'string' &&
      item.result.length <= 40
  );
  if (attempts.length !== value.attempts.length) return undefined;
  return {
    directResult: value.directResult.slice(0, 40),
    activeTabCount,
    candidateTabCount,
    attempts: attempts as CodexQuotaDiagnostic['attempts'],
  };
};

/** Validate a sanitized snapshot before it enters view state or local storage. */
export const parseCodexQuotaSnapshot = (value: unknown): CodexQuotaSnapshot | null => {
  if (!isRecord(value) || value.version !== CODEX_QUOTA_CACHE_VERSION) return null;
  if (!Array.isArray(value.windows) || !value.windows.length || !value.windows.every(isWindow)) {
    return null;
  }
  if (typeof value.fetchedAt !== 'number' || !Number.isFinite(value.fetchedAt)) return null;
  return value as unknown as CodexQuotaSnapshot;
};

/** Validate the narrow runtime response contract without accepting raw upstream data. */
export const parseCodexQuotaResponse = (value: unknown): CodexQuotaResponse => {
  if (!isRecord(value) || typeof value.ok !== 'boolean') {
    return { ok: false, error: 'incompatible_response' };
  }
  if (value.ok) {
    const snapshot = parseCodexQuotaSnapshot(value.snapshot);
    const diagnostic = parseDiagnostic(value.diagnostic);
    return snapshot
      ? { ok: true, snapshot, ...(diagnostic ? { diagnostic } : {}) }
      : { ok: false, error: 'incompatible_response' };
  }
  const allowed = [
    'signed_out',
    'forbidden',
    'network',
    'timeout',
    'upstream_rejection',
    'response_too_large',
    'incompatible_response',
    'empty_data',
    'unavailable',
  ];
  const diagnostic = parseDiagnostic(value.diagnostic);
  return allowed.includes(String(value.error))
    ? ({
        ok: false,
        error: value.error,
        ...(diagnostic ? { diagnostic } : {}),
      } as CodexQuotaResponse)
    : { ok: false, error: 'incompatible_response' };
};
