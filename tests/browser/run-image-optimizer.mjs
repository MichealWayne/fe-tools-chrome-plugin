import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// Run with Vite already serving the repository. Uses an isolated, disposable Chrome profile.
const directory = await mkdtemp(join(tmpdir(), 'image-optimizer-qa-'));
const executable =
  process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const server = process.env.IMAGE_OPTIMIZER_TEST_URL || 'http://127.0.0.1:8080';
const chrome = spawn(
  executable,
  [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--remote-debugging-port=0',
    `--user-data-dir=${directory}`,
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] }
);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    let stderr = '';
    const timeout = setTimeout(
      () => reject(new Error('Chrome did not expose a debugging endpoint')),
      15000
    );
    chrome.on('error', error => {
      clearTimeout(timeout);
      reject(error);
    });
    chrome.on('exit', code => {
      clearTimeout(timeout);
      reject(new Error(`Chrome exited: ${code}`));
    });
    chrome.stderr.on('data', data => {
      stderr += data.toString();
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
  });
  const address = new URL(endpoint);
  const pages = await (await fetch(`http://${address.host}/json/list`)).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  const errors = [];
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(JSON.stringify(message.error)));
      else request.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown')
      errors.push(message.params.exceptionDetails);
  };
  const call = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const request = ++id;
      pending.set(request, { resolve, reject });
      socket.send(JSON.stringify({ id: request, method, params }));
    });
  await call('Runtime.enable');
  const results = [];
  for (const [width, language] of [
    [360, 'zh'],
    [500, 'en'],
    [1000, 'zh'],
  ]) {
    const downloadPath = join(directory, `downloads-${width}-${language}`);
    await mkdir(downloadPath);
    await call('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath });
    await call('Emulation.setDeviceMetricsOverride', {
      width,
      height: 1100,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await call('Page.navigate', {
      url: `${server}/tests/browser/image-optimizer.html?lang=${language}`,
    });
    let report;
    for (let attempt = 0; attempt < 240; attempt++) {
      await delay(250);
      const response = await call('Runtime.evaluate', {
        expression: 'document.querySelector("#report")?.textContent',
        returnByValue: true,
      });
      const value = response.result?.value;
      if (value?.startsWith('{')) {
        report = JSON.parse(value);
        break;
      }
    }
    if (!report) throw new Error('Fixture timed out');
    if (report.status === 'PASS') {
      let downloaded;
      for (let attempt = 0; attempt < 40; attempt++) {
        try {
          downloaded = await readFile(join(downloadPath, report.result.downloadName));
          break;
        } catch {
          await delay(100);
        }
      }
      const validDownload =
        downloaded?.length === report.result.expectedDownloadBytes &&
        downloaded?.subarray(0, 4).toString() === 'RIFF' &&
        downloaded?.subarray(8, 12).toString() === 'WEBP';
      report.checks.push({
        name: 'native download filename, bytes and WebP signature',
        passed: Boolean(validDownload),
      });
      if (!validDownload) report.status = 'FAIL';
      const originalDownload = await readFile(
        join(downloadPath, report.result.originalDownloadName)
      ).catch(() => null);
      const originalUnchanged =
        originalDownload &&
        createHash('sha256').update(originalDownload).digest('hex') === report.result.originalHash;
      report.checks.push({
        name: 'retained native download keeps source filename and exact SHA-256',
        passed: Boolean(originalUnchanged),
      });
      if (!originalUnchanged) report.status = 'FAIL';
    }
    const screenshot = await call('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    const imagePath = join(tmpdir(), `image-optimizer-${width}-${language}.png`);
    await writeFile(imagePath, Buffer.from(screenshot.data, 'base64'));
    results.push({ width, language, screenshot: imagePath, ...report });
    if (report.status !== 'PASS') break;
  }
  const reportPath = join(tmpdir(), 'image-optimizer-functional-report.json');
  await writeFile(reportPath, JSON.stringify({ errors, results }, null, 2));
  console.log(JSON.stringify({ reportPath, errors, results }, null, 2));
  if (errors.length || results.length !== 3 || results.some(result => result.status !== 'PASS'))
    process.exitCode = 1;
} finally {
  socket?.close();
  chrome.kill();
  await new Promise(resolve => {
    if (chrome.exitCode !== null) resolve();
    else chrome.once('exit', resolve);
  });
  await rm(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
