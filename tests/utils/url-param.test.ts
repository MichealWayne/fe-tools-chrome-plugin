import { afterEach, describe, expect, it } from 'vitest';
import { getUrlParam } from '@/utils';

describe('getUrlParam', () => {
  afterEach(() => {
    window.location.search = '';
  });

  it('returns an encoded URL parameter without truncating its query string', () => {
    const url = 'https://example.test/path?a=1&b=2#section';
    window.location.search = `?message=${encodeURIComponent(url)}`;

    expect(getUrlParam('message')).toBe(url);
  });
});
