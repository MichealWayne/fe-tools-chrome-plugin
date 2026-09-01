import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CodexQuota from '@/components/CodexQuota/index.vue';
import { langManager } from '@/utils/i18n';

const cache = vi.hoisted(() => ({
  snapshot: null as any,
  clear: vi.fn(),
  write: vi.fn(),
}));
const request = vi.hoisted(() => vi.fn());

vi.mock('@/components/CodexQuota/cache', async importOriginal => {
  const original = await importOriginal<typeof import('@/components/CodexQuota/cache')>();
  return {
    ...original,
    readCodexQuotaCache: vi.fn(async () => cache.snapshot),
    writeCodexQuotaCache: cache.write,
    clearCodexQuotaCache: cache.clear,
  };
});
vi.mock('@/components/CodexQuota/client', () => ({ requestCodexQuota: request }));

const snapshot = (fetchedAt = Date.now()) => ({
  version: 1 as const,
  fetchedAt,
  windows: [
    {
      id: 'five-hour',
      kind: 'five-hour' as const,
      usedPercent: 25,
      remainingPercent: 75,
      durationMinutes: 300,
      resetAt: Date.now() + 60_000,
    },
  ],
});

describe('CodexQuota component', () => {
  beforeEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    cache.snapshot = null;
    cache.clear.mockReset();
    cache.write.mockReset();
    request.mockReset();
    langManager.setLanguage('en');
  });

  it('renders a successful remaining allowance and official dashboard action', async () => {
    request.mockResolvedValue({ ok: true, snapshot: snapshot() });
    const wrapper = mount(CodexQuota);
    await flushPromises();

    expect(wrapper.text()).toContain('75% remaining');
    expect(wrapper.text()).toContain('5-hour quota');
    expect(wrapper.text()).toContain('Open official usage');
    expect(wrapper.text()).toContain('View reset tracker');
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('75');
    expect(cache.write).toHaveBeenCalledOnce();
  });

  it('preserves stale cache while showing a retryable failure', async () => {
    cache.snapshot = snapshot(Date.now() - 601_000);
    request.mockResolvedValue({ ok: false, error: 'network' });
    const wrapper = mount(CodexQuota);
    await flushPromises();

    expect(wrapper.text()).toContain('Data is stale');
    expect(wrapper.text()).toContain('75% remaining');
    expect(wrapper.text()).toContain('network request failed');
  });

  it.each([
    ['signed_out', 'No authenticated quota'],
    ['incompatible_response', 'unsupported quota format'],
    ['empty_data', 'no Codex quota windows'],
  ])('renders the %s state without breaking actions', async (error, message) => {
    request.mockResolvedValue({ ok: false, error });
    const wrapper = mount(CodexQuota);
    await flushPromises();

    expect(wrapper.text()).toContain(message);
    expect(wrapper.findAll('button').length).toBeGreaterThan(1);
  });

  it('renders sanitized request diagnostics without account data', async () => {
    request.mockResolvedValue({
      ok: false,
      error: 'signed_out',
      diagnostic: {
        directResult: 'signed_out',
        activeTabCount: 1,
        candidateTabCount: 2,
        attempts: [
          { world: 'isolated', result: 'signed_out' },
          { world: 'main', result: 'signed_out' },
        ],
      },
    });
    const wrapper = mount(CodexQuota);
    await flushPromises();

    expect(wrapper.text()).toContain('Diagnostic information');
    expect(wrapper.text()).toContain('active tabs: 1');
    expect(wrapper.text()).toContain('Page main world: signed_out');
    expect(wrapper.get('.codex-quota__debug').text()).not.toMatch(/token|cookie|account_id/i);
  });

  it('refreshes from keyboard activation and supports Chinese localization', async () => {
    langManager.setLanguage('zh');
    cache.snapshot = snapshot();
    request.mockResolvedValue({ ok: true, snapshot: snapshot() });
    const wrapper = mount(CodexQuota);
    await flushPromises();
    const refresh = wrapper.get('button[s-color="blue"]');
    await refresh.trigger('keydown.enter');
    await refresh.trigger('click');
    await flushPromises();

    expect(request).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain('剩余 75%');
    expect(wrapper.text()).toContain('打开官方用量页');
  });

  it('counts down to an in-page automatic refresh and cancels it when unmounted', async () => {
    vi.useFakeTimers();
    const fetchedAt = Date.now();
    cache.snapshot = snapshot(fetchedAt);
    request.mockResolvedValue({ ok: true, snapshot: snapshot() });
    const wrapper = mount(CodexQuota);
    await flushPromises();

    expect(wrapper.text()).toContain('Auto-refresh in 10:00');
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    await flushPromises();
    expect(request).toHaveBeenCalledWith(true);

    request.mockClear();
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    expect(request).not.toHaveBeenCalled();
  });

  it('pauses the countdown while the popup document is hidden and resumes from the remaining time', async () => {
    vi.useFakeTimers();
    cache.snapshot = snapshot(Date.now());
    request.mockResolvedValue({ ok: true, snapshot: snapshot() });
    const wrapper = mount(CodexQuota);
    await flushPromises();

    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    expect(request).not.toHaveBeenCalled();

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(8 * 60 * 1000);
    await flushPromises();
    expect(request).toHaveBeenCalledWith(true);
    wrapper.unmount();
  });
});
