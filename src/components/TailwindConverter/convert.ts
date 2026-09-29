import { utilityDeclarations } from './utility-declarations';

export interface ConversionResult {
  css: string;
  unsupported: string[];
  convertedCount: number;
}

const breakpoints: Record<string, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};
const states: Record<string, string> = {
  hover: ':hover',
  focus: ':focus',
  active: ':active',
  disabled: ':disabled',
};
const arbitraryProperties: Record<string, string> = {
  w: 'width',
  h: 'height',
  'min-w': 'min-width',
  'max-w': 'max-width',
  'min-h': 'min-height',
  'max-h': 'max-height',
  p: 'padding',
  px: 'padding-inline',
  py: 'padding-block',
  pt: 'padding-top',
  pr: 'padding-right',
  pb: 'padding-bottom',
  pl: 'padding-left',
  m: 'margin',
  mx: 'margin-inline',
  my: 'margin-block',
  mt: 'margin-top',
  mr: 'margin-right',
  mb: 'margin-bottom',
  ml: 'margin-left',
  gap: 'gap',
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  bg: 'background-color',
  border: 'border-color',
  text: 'color',
  leading: 'line-height',
  tracking: 'letter-spacing',
  rounded: 'border-radius',
  opacity: 'opacity',
  z: 'z-index',
};

const splitClasses = (input: string): string[] => {
  const tokens: string[] = [];
  let current = '';
  let bracketDepth = 0;
  for (const char of input) {
    if (char === '[') bracketDepth++;
    if (char === ']') bracketDepth--;
    if (/\s/.test(char) && bracketDepth === 0) {
      if (current) tokens.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);
  return tokens;
};

const escapeClass = (value: string): string => {
  const escaped = value.replace(/[^a-zA-Z0-9_-]/g, char => `\\${char}`);
  return escaped.replace(/^\d/, digit => `\\3${digit} `);
};

const arbitraryDeclaration = (utility: string): string | undefined => {
  const match = /^([\w-]+)-\[([^\]]+)\]$/.exec(utility);
  if (!match) return undefined;
  const [, prefix, rawValue] = match;
  if (!arbitraryProperties[prefix] || /[;{}<>\\]|url\s*\(/i.test(rawValue)) return undefined;
  const value = rawValue.replace(/_/g, ' ').trim();
  if (!value) return undefined;
  const property =
    prefix === 'text' && !/^(#|rgb\(|hsl\(|oklch\(|color\(|var\()/i.test(value)
      ? 'font-size'
      : arbitraryProperties[prefix];
  return `${property}: ${value};`;
};

/** Convert a bounded set of Tailwind v3 utilities to class-scoped CSS, entirely offline. */
export const convertTailwindClasses = (input: string): ConversionResult => {
  const unsupported: string[] = [];
  const rules: string[] = [];
  const seen = new Set<string>();

  for (const token of splitClasses(input)) {
    if (seen.has(token)) continue;
    seen.add(token);
    const parts = token.split(/:(?![^\[]*\])/);
    const utility = parts.pop() || '';
    const variants = parts;
    const breakpoint = variants.filter(part => breakpoints[part]);
    const pseudo = variants.filter(part => states[part]);
    const validVariants =
      breakpoint.length <= 1 &&
      pseudo.length <= 1 &&
      breakpoint.length + pseudo.length === variants.length;
    const declaration = Object.prototype.hasOwnProperty.call(utilityDeclarations, utility)
      ? utilityDeclarations[utility]
      : arbitraryDeclaration(utility);
    if (!validVariants || !declaration) {
      unsupported.push(token);
      continue;
    }

    const selector = `.${escapeClass(token)}${pseudo.map(part => states[part]).join('')}`;
    const declarations = declaration
      .replace(/\\n/g, '\n')
      .split(';')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => `  ${line};`)
      .join('\n');
    let rule = `${selector} {\n${declarations}\n}`;
    if (breakpoint.length)
      rule = `@media (min-width: ${breakpoints[breakpoint[0]]}) {\n  ${rule.replace(/\n/g, '\n  ')}\n}`;
    rules.push(rule);
  }

  return { css: rules.join('\n\n'), unsupported, convertedCount: rules.length };
};
