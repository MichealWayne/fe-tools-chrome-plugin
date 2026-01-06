import DOMPurify, { type Config } from 'dompurify';

const INLINE_ALLOWED_TAGS = ['strong', 'em', 'span', 'br'];
const INLINE_ALLOWED_ATTR = ['class', 's-ft_sub_'];

/**
 * Sanitize arbitrary HTML for safe rendering.
 * @param input - Raw HTML string input.
 * @param config - Optional DOMPurify configuration.
 */
export const sanitizeHtml = (input: string, config: Config = {}): string => {
  const value = typeof input === 'string' ? input : String(input ?? '');
  return DOMPurify.sanitize(value, config);
};

/**
 * Sanitize inline markup used for search highlights and labels.
 * @param input - Inline HTML content.
 */
export const sanitizeInlineMarkup = (input: string): string =>
  sanitizeHtml(input, {
    ALLOWED_TAGS: INLINE_ALLOWED_TAGS,
    ALLOWED_ATTR: INLINE_ALLOWED_ATTR,
  });

/**
 * Sanitize SVG markup for preview rendering.
 * @param input - SVG markup string.
 */
export const sanitizeSvgMarkup = (input: string): string =>
  sanitizeHtml(input, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
