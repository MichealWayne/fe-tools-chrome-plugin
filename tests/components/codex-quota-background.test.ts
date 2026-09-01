import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const backgroundScript = readFileSync('public/scripts/backgroundV3.js', 'utf8');

describe('Codex quota background fallback', () => {
  it('runs quota notifications every ten minutes and skips failed results', () => {
    expect(backgroundScript).toContain('const CODEX_QUOTA_ALARM_MINUTES = 10');
    expect(backgroundScript).toContain('if (!result.ok) return;');
    expect(backgroundScript).toContain('CodexQuotaNotifications.evaluate');
    expect(backgroundScript).toContain('chrome.notifications.create');
  });

  it('returns the isolated-world quota result through an injected function', () => {
    expect(backgroundScript).toContain("files: ['scripts/codex-quota-runtime.js']");
    expect(backgroundScript).toMatch(/func:\s*async\s*\(\)\s*=>/);
    expect(backgroundScript).toContain('return globalThis.CodexQuotaRuntime.fetchQuota(fetch)');
    expect(backgroundScript).not.toContain("files: ['scripts/codex-quota-page-probe.js']");
  });

  it('uses a page-local session bearer only for the fixed usage request', () => {
    expect(backgroundScript).toContain("world: 'MAIN'");
    expect(backgroundScript).toContain('func: readCodexQuotaInPageWorld');
    expect(backgroundScript).toContain(
      "const sessionEndpoint = 'https://chatgpt.com/api/auth/session'"
    );
    expect(backgroundScript).toContain(
      "const endpoint = 'https://chatgpt.com/backend-api/wham/usage'"
    );
    expect(backgroundScript).toContain("pick(session.value, ['accessToken', 'access_token'])");
    expect(backgroundScript).toContain('Authorization: `Bearer ${sessionToken}`');
    expect(backgroundScript).toContain("sessionToken = '';");
    expect(backgroundScript).toContain(
      'return { ok: true, snapshot: { version: 1, windows, fetchedAt: Date.now() } }'
    );
    expect(backgroundScript).not.toContain('snapshot: { version: 1, windows, sessionToken');
    expect(backgroundScript).not.toContain("diagnostic.attempts.push({ world: 'main', token");
  });

  it('discovers currently open ChatGPT tabs without URL-filter query failures', () => {
    expect(backgroundScript).toContain('chrome.tabs.query({})');
    expect(backgroundScript).toContain(
      'chrome.tabs.query({ active: true, lastFocusedWindow: true })'
    );
    expect(backgroundScript).toContain("hostname === 'chatgpt.com'");
    expect(backgroundScript).toContain("hostname === 'chat.openai.com'");
    expect(backgroundScript).toContain('for (const tab of tabs)');
  });

  it('returns only allowlisted diagnostic categories and tab counts on failure', () => {
    expect(backgroundScript).toContain('directResult,');
    expect(backgroundScript).toContain('activeTabCount: activeTabs.length');
    expect(backgroundScript).toContain('candidateTabCount: tabs.length');
    expect(backgroundScript).toContain("diagnostic.attempts.push({ world: 'main'");
    expect(backgroundScript).not.toContain('response.headers.get');
  });
});
