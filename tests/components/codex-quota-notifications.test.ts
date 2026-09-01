import { beforeAll, describe, expect, it } from 'vitest';

type QuotaWindow = {
  id: string;
  kind: 'five-hour' | 'weekly' | 'additional';
  remainingPercent: number;
  durationMinutes: number;
  resetAt: number;
};

type Snapshot = { windows: QuotaWindow[] };
type NotificationRuntime = {
  evaluate: (
    previous: Snapshot | null,
    current: Snapshot
  ) => Array<{ type: 'low' | 'reset'; window: QuotaWindow }>;
};

let runtime: NotificationRuntime;
const snapshot = (remainingPercent: number, resetAt = 1): Snapshot => ({
  windows: [
    { id: 'five-hour', kind: 'five-hour', remainingPercent, durationMinutes: 300, resetAt },
  ],
});

beforeAll(async () => {
  await import('../../public/scripts/codex-quota-notifications.js');
  runtime = (globalThis as typeof globalThis & { CodexQuotaNotifications: NotificationRuntime })
    .CodexQuotaNotifications;
});

describe('Codex quota notification decisions', () => {
  it('notifies only when remaining quota crosses the low threshold', () => {
    expect(runtime.evaluate(snapshot(11), snapshot(10)).map(event => event.type)).toEqual(['low']);
    expect(runtime.evaluate(snapshot(10), snapshot(9))).toEqual([]);
  });

  it('notifies after a confirmed reset advances the window and restores quota', () => {
    expect(runtime.evaluate(snapshot(2, 1), snapshot(100, 2)).map(event => event.type)).toEqual([
      'reset',
    ]);
    expect(runtime.evaluate(snapshot(2, 1), snapshot(2, 2))).toEqual([]);
  });

  it('can report an initially observed low window', () => {
    expect(runtime.evaluate(null, snapshot(5)).map(event => event.type)).toEqual(['low']);
  });
});
