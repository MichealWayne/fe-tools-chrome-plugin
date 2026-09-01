import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (file: string) => JSON.parse(readFileSync(resolve(file), 'utf8'));

describe('Chrome extension localization resources', () => {
  it('uses Chrome message placeholders in the manifest', () => {
    const manifest = readJson('public/manifest.json');
    expect(manifest.default_locale).toBe('en');
    expect(manifest.name).toBe('__MSG_extensionName__');
    expect(manifest.description).toBe('__MSG_extensionDescription__');
    expect(manifest.action.default_title).toBe('__MSG_extensionActionTitle__');
  });

  it('provides matching English and Chinese entry-point message keys', () => {
    const english = readJson('public/_locales/en/messages.json');
    const chinese = readJson('public/_locales/zh_CN/messages.json');
    expect(Object.keys(english).sort()).toEqual(Object.keys(chinese).sort());
    expect(Object.values(english).every(value => !/[\u3400-\u9fff]/.test(value.message))).toBe(
      true
    );
  });
});
