import { describe, expect, it, vi } from 'vitest';

const { handleTranslate } = vi.hoisted(() => ({ handleTranslate: vi.fn() }));

vi.mock('@/api', () => ({ default: { handleTranslate } }));

import handleTxtTranslate from '@/components/LangTranslator/handleTxtTranslate';

describe('translation request handling', () => {
  it('rejects when the translation API fails instead of remaining pending', async () => {
    handleTranslate.mockRejectedValueOnce(new Error('network failed'));

    const outcome = await Promise.race([
      handleTxtTranslate('hello').then(
        () => 'resolved',
        () => 'rejected'
      ),
      new Promise(resolve => setTimeout(() => resolve('pending'), 20)),
    ]);

    expect(outcome).toBe('rejected');
  });
});
