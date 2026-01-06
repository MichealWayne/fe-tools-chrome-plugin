import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeInlineMarkup, sanitizeSvgMarkup } from '@/utils/sanitize';

describe('sanitize helpers', () => {
  it('sanitizes inline markup for search results', () => {
    const result = sanitizeInlineMarkup(
      '<img src=x onerror=alert(1)><strong>ok</strong><em s-ft_sub_>x</em>'
    );

    expect(result).toContain('<strong>ok</strong>');
    expect(result).toContain('<em');
    expect(result).toContain('s-ft_sub_');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('<img');
  });

  it('sanitizes generic HTML content', () => {
    const result = sanitizeHtml('<div onclick="alert(1)">ok</div>');
    expect(result).toContain('<div>ok</div>');
    expect(result).not.toContain('onclick');
  });

  it('sanitizes SVG preview markup', () => {
    const result = sanitizeSvgMarkup('<svg><script>alert(1)</script><circle></circle></svg>');
    expect(result).toContain('<svg');
    expect(result).toContain('<circle');
    expect(result).not.toContain('<script');
  });
});
