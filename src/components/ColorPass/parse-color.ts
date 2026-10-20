/** Accepts common opaque CSS forms without silently discarding alpha. */
export const normalizeColorInput = (
  source: 'hex' | 'rgb' | 'hsb' | 'hsl',
  input: string
): string => {
  const value = input.trim();
  if (source === 'hex') {
    const hex = value.replace(/^#/, '');
    return /^[\da-f]{3}$/i.test(hex)
      ? hex
          .split('')
          .map(char => char + char)
          .join('')
      : hex;
  }
  const wrapper = value.match(/^(rgb|hsl|hsb)\(([^()]*)\)$/i);
  if (wrapper && wrapper[1].toLowerCase() !== source) return '';
  const raw = wrapper ? wrapper[2].trim() : value;
  const parts = raw.includes(',') ? raw.split(',').map(part => part.trim()) : raw.split(/\s+/);
  if (parts.length !== 3 || parts.some(part => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)%?$/.test(part)))
    return '';
  if (source === 'rgb') {
    if (parts.some(part => part.endsWith('%'))) return '';
  } else if (wrapper && (!parts[1].endsWith('%') || !parts[2].endsWith('%'))) return '';
  return parts.join(',');
};
