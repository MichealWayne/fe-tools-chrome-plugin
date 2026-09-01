export type CodexQuotaWindowKind = 'five-hour' | 'weekly' | 'additional';

export type CodexQuotaError =
  | 'signed_out'
  | 'forbidden'
  | 'network'
  | 'timeout'
  | 'upstream_rejection'
  | 'response_too_large'
  | 'incompatible_response'
  | 'empty_data'
  | 'unavailable';

export interface CodexQuotaWindow {
  id: string;
  kind: CodexQuotaWindowKind;
  usedPercent: number;
  remainingPercent: number;
  durationMinutes: number;
  resetAt: number;
}

export interface CodexQuotaSnapshot {
  version: 1;
  windows: CodexQuotaWindow[];
  fetchedAt: number;
}

export type CodexQuotaProbeWorld = 'isolated' | 'main';

export interface CodexQuotaDiagnostic {
  directResult: string;
  activeTabCount: number;
  candidateTabCount: number;
  attempts: Array<{
    world: CodexQuotaProbeWorld;
    result: string;
  }>;
}

export type CodexQuotaResponse =
  | { ok: true; snapshot: CodexQuotaSnapshot; diagnostic?: CodexQuotaDiagnostic }
  | { ok: false; error: CodexQuotaError; diagnostic?: CodexQuotaDiagnostic };

export type CodexQuotaFreshness = 'missing' | 'fresh' | 'stale';
