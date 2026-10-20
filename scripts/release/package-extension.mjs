import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ARCHIVE_NAME = 'fe-tools-chrome-extension.zip';
export const CHECKSUM_NAME = 'SHA256SUMS.txt';
const ALLOWED_ROOTS = new Set([
  'manifest.json',
  'index.html',
  'icon.png',
  'assets',
  'scripts',
  '_locales',
]);
const json = file => JSON.parse(readFileSync(file, 'utf8'));
export const sha256 = data => createHash('sha256').update(data).digest('hex');

export const readVersion = root => {
  const { version } = json(join(root, 'package.json'));
  if (
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version) ||
    version === '0.0.0' ||
    version.split('.').some(part => Number(part) > 65535)
  ) {
    throw new Error('Release version must be a three-part Chrome-compatible version');
  }
  return version;
};

const collectFiles = (directory, prefix = '') =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.')) return [];
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (/[\r\n\\]/.test(relative)) throw new Error(`Unsupported package path: ${relative}`);
    if (entry.isSymbolicLink()) throw new Error(`Package symlink is not allowed: ${relative}`);
    if (!prefix && !ALLOWED_ROOTS.has(entry.name)) {
      throw new Error(`Unexpected package entry: ${relative}`);
    }
    if (entry.isDirectory()) return collectFiles(join(directory, entry.name), relative);
    if (!entry.isFile()) throw new Error(`Unsupported package entry: ${relative}`);
    return [relative];
  });

const validateBuild = (root, files) => {
  const dist = join(root, 'dist');
  const manifest = json(join(dist, 'manifest.json'));
  const sourceManifest = json(join(root, 'public/manifest.json'));
  const version = readVersion(root);
  if (sourceManifest.version !== version || manifest.version !== version) {
    throw new Error('Package, source manifest and built manifest versions must match');
  }
  const fileSet = new Set(files);
  const requireFile = (name, base = '') => {
    if (typeof name !== 'string' || !name || name.split('/').includes('..')) {
      throw new Error('Invalid built runtime file reference');
    }
    const local = name.startsWith('/') ? name.slice(1) : base + name;
    if (!fileSet.has(local)) throw new Error(`Missing built runtime file: ${local}`);
    return local;
  };

  requireFile('manifest.json');
  const html = requireFile(manifest.action?.default_popup || 'index.html');
  for (const name of Object.values(manifest.icons || {})) requireFile(name);
  const actionIcon = manifest.action?.default_icon;
  for (const name of typeof actionIcon === 'string'
    ? [actionIcon]
    : Object.values(actionIcon || {})) {
    requireFile(name);
  }
  for (const script of manifest.content_scripts || []) {
    for (const name of [...(script.js || []), ...(script.css || [])]) requireFile(name);
  }
  const visited = new Set();
  const workerImports = name => {
    const local = requireFile(name);
    if (visited.has(local)) return;
    visited.add(local);
    const source = readFileSync(join(dist, local), 'utf8');
    for (const match of source.matchAll(/importScripts\(([^)]*)\)/g)) {
      for (const imported of match[1].matchAll(/['"]([^'"]+)['"]/g)) {
        const base = local.includes('/') ? local.slice(0, local.lastIndexOf('/') + 1) : '';
        workerImports(requireFile(imported[1], base));
      }
    }
  };
  workerImports(manifest.background?.service_worker);
  for (const match of readFileSync(join(dist, html), 'utf8').matchAll(
    /(?:src|href)=["']([^"']+)["']/g
  )) {
    requireFile(match[1]);
  }
  for (const locale of new Set([manifest.default_locale, 'en', 'zh_CN'])) {
    json(join(dist, requireFile(`_locales/${locale}/messages.json`)));
  }
  return version;
};

/** Packages only built runtime files. Normalized timestamps make reruns byte-stable. */
export const packageExtension = ({
  root = process.cwd(),
  outputDir = join(root, 'release-artifacts'),
} = {}) => {
  const dist = join(root, 'dist');
  if (!existsSync(dist) || lstatSync(dist).isSymbolicLink()) throw new Error('Build dist/ first');
  const files = collectFiles(dist).sort();
  const version = validateBuild(root, files);
  const staging = mkdtempSync(join(tmpdir(), 'fe-tools-package-'));
  try {
    const contents = join(staging, 'contents');
    mkdirSync(contents);
    const timestamp = new Date('2000-01-01T00:00:00Z');
    for (const file of files) {
      const target = join(contents, file);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(join(dist, file), target);
      utimesSync(target, timestamp, timestamp);
    }
    const archive = join(staging, ARCHIVE_NAME);
    execFileSync('zip', ['-X', '-q', archive, '-@'], {
      cwd: contents,
      input: files.join('\n') + '\n',
      env: { ...process.env, TZ: 'UTC' },
    });
    const data = readFileSync(archive);
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(join(outputDir, ARCHIVE_NAME), data);
    writeFileSync(join(outputDir, CHECKSUM_NAME), `${sha256(data)}  ${ARCHIVE_NAME}\n`);
    return { version, archive: join(outputDir, ARCHIVE_NAME), sha256: sha256(data) };
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = packageExtension();
  console.log(`Packaged v${result.version}: ${result.archive}`);
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `version=${result.version}\n`, { flag: 'a' });
  }
}
