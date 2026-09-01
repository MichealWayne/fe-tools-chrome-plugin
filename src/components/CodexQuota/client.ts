import { parseCodexQuotaResponse } from './normalizer';
import { sendRuntimeMessage } from '@/extension/chrome-client';
import type { CodexQuotaResponse } from './types';

let inFlight: Promise<CodexQuotaResponse> | null = null;
let backoffUntil = 0;

const sendQuotaMessage = (): Promise<unknown> =>
  typeof chrome === 'undefined' || !chrome.runtime?.sendMessage
    ? Promise.resolve({ ok: false, error: 'unavailable' })
    : sendRuntimeMessage({ action: 'getCodexQuota' }).catch(() => ({
        ok: false,
        error: 'unavailable',
      }));

export const requestCodexQuota = (force = false): Promise<CodexQuotaResponse> => {
  if (inFlight) return inFlight;
  if (!force && Date.now() < backoffUntil) {
    return Promise.resolve({ ok: false, error: 'network' });
  }
  inFlight = sendQuotaMessage()
    .then(parseCodexQuotaResponse)
    .then(result => {
      if (!result.ok) backoffUntil = Date.now() + 5000;
      else backoffUntil = 0;
      return result;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
};
