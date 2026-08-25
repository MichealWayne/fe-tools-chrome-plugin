import type { EnvironmentVariable } from '../types';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Replace PostMan-style environment placeholders without treating names or values as RegExp syntax.
 */
export const replaceEnvironmentVariables = (
  text: string,
  variables: EnvironmentVariable[]
): string =>
  variables.reduce((result, variable) => {
    if (!variable.key || !variable.value) return result;

    const placeholder = new RegExp(`{{\\s*${escapeRegExp(variable.key)}\\s*}}`, 'g');
    return result.replace(placeholder, () => variable.value);
  }, text);
