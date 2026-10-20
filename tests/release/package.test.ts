import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { packageExtension } from '../../scripts/release/package-extension.mjs';

const directories: string[] = [];
const fixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'extension-package-test-'));
  directories.push(root);
  const put = (name: string, text: string) => {
    const target = join(root, name);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, text);
  };
  put('package.json', JSON.stringify({ version: '1.8.0' }));
  const manifest = {
    manifest_version: 3,
    version: '1.8.0',
    default_locale: 'en',
    icons: { '16': 'icon.png' },
    action: { default_popup: 'index.html', default_icon: 'icon.png' },
    background: { service_worker: 'scripts/background.js' },
    content_scripts: [{ js: ['scripts/content.js'] }],
  };
  put('public/manifest.json', JSON.stringify(manifest));
  put('dist/manifest.json', JSON.stringify(manifest));
  put('dist/index.html', '<script type="module" src="/assets/main.js"></script>');
  put('dist/assets/main.js', 'console.log("fixture")');
  put('dist/icon.png', 'fixture-image');
  put('dist/scripts/background.js', "importScripts('shared.js');");
  put('dist/scripts/shared.js', 'globalThis.shared = true;');
  put('dist/scripts/content.js', 'console.log("content")');
  put('dist/_locales/en/messages.json', '{"name":{"message":"Tools"}}');
  put('dist/_locales/zh_CN/messages.json', '{"name":{"message":"工具"}}');
  return { root, put, outputDir: join(root, 'release-artifacts') };
};

afterEach(() =>
  directories.splice(0).forEach(root => rmSync(root, { recursive: true, force: true }))
);

describe('installable extension package', () => {
  it('puts the built extension at the ZIP root, excludes hidden files, and hashes its exact bytes', () => {
    const { root, put, outputDir } = fixture();
    put('dist/.DS_Store', 'metadata');
    put('dist/assets/.env', 'not for distribution');
    put('src/private.ts', 'source is not packaged');
    packageExtension({ root, outputDir });
    const archive = join(outputDir, 'fe-tools-chrome-extension.zip');
    const entries = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' })
      .trim()
      .split('\n');
    expect(entries).toContain('manifest.json');
    expect(entries).toContain('_locales/en/messages.json');
    expect(
      entries.some(
        name =>
          name.startsWith('dist/') ||
          name.includes('.env') ||
          name.includes('.DS_Store') ||
          name.startsWith('src/')
      )
    ).toBe(false);
    const digest = createHash('sha256').update(readFileSync(archive)).digest('hex');
    expect(readFileSync(join(outputDir, 'SHA256SUMS.txt'), 'utf8')).toBe(
      `${digest}  fe-tools-chrome-extension.zip\n`
    );
    expect(execFileSync('unzip', ['-p', archive, 'manifest.json'], { encoding: 'utf8' })).toContain(
      '1.8.0'
    );
  });

  it('produces identical ZIP bytes after checkout timestamps change', () => {
    const { root, outputDir } = fixture();
    packageExtension({ root, outputDir });
    const first = readFileSync(join(outputDir, 'fe-tools-chrome-extension.zip'));
    utimesSync(join(root, 'dist/assets/main.js'), new Date(), new Date());
    packageExtension({ root, outputDir });
    expect(readFileSync(join(outputDir, 'fe-tools-chrome-extension.zip'))).toEqual(first);
  });

  it('rejects source/built version mismatches before producing an archive', () => {
    const { root, put, outputDir } = fixture();
    put('package.json', '{"version":"1.8.1"}');
    expect(() => packageExtension({ root, outputDir })).toThrow(/version/i);
  });

  it.each([
    'dist/scripts/shared.js',
    'dist/scripts/content.js',
    'dist/assets/main.js',
    'dist/_locales/en/messages.json',
  ])('rejects a missing runtime file: %s', file => {
    const { root, outputDir } = fixture();
    rmSync(join(root, file));
    expect(() => packageExtension({ root, outputDir })).toThrow();
  });

  it('rejects unexpected top-level files and symlinks instead of leaking them into the ZIP', () => {
    const { root, put, outputDir } = fixture();
    put('dist/credentials.json', '{}');
    expect(() => packageExtension({ root, outputDir })).toThrow(/unexpected/i);
    rmSync(join(root, 'dist/credentials.json'));
    symlinkSync(join(root, 'package.json'), join(root, 'dist/assets/link.json'));
    expect(() => packageExtension({ root, outputDir })).toThrow(/symlink/i);
  });
});
