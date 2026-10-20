# Installation and Updates

[中文](installation.md) · [Back to README](../README.en.md)

The built package needs no Node.js, pnpm, or source build.

## Download

- [Download the latest installation package](https://github.com/MichealWayne/fe-tools-chrome-plugin/releases/latest/download/fe-tools-chrome-extension.zip)
- [Browse all versions](https://github.com/MichealWayne/fe-tools-chrome-plugin/releases)

Select `fe-tools-chrome-extension.zip` under the release's Assets. GitHub's generated
`Source code (zip)` and `Source code (tar.gz)` archives require building. The latest
download link works after the first public release containing this asset. Draft releases
are not public downloads.

Optionally download `SHA256SUMS.txt` alongside the ZIP and verify it in the download directory:

```sh
# macOS
shasum -a 256 -c SHA256SUMS.txt
# Linux
sha256sum -c SHA256SUMS.txt
```

On Windows PowerShell, run `Get-FileHash .\fe-tools-chrome-extension.zip -Algorithm SHA256`
and compare its hash with `SHA256SUMS.txt`.

## Load in Chrome

1. Extract the ZIP into a permanent directory, such as `Documents/fe-tools-chrome-extension`.
2. Locate the directory directly containing `manifest.json`:

   ```text
   fe-tools-chrome-extension/
     manifest.json
     index.html
     icon.png
     assets/
     scripts/
     _locales/
   ```

3. Enter `chrome://extensions/` in Chrome's address bar.
4. Enable Developer mode in the top-right corner.
5. Click "Load unpacked" and select the directory above.
6. Open the extensions menu in the browser toolbar and pin FrontEnd Tools.

Keep Developer mode enabled and retain the installation directory. The loaded extension
continues to depend on those files. See [Permissions and Data](../README.en.md#permissions-and-data)
for site access and network behavior.

## Manual updates

GitHub ZIP installations do not update automatically.

1. Export or back up important Postman requests, environment settings, and other data.
   Back up the old installation directory too.
2. Download and extract the new version. Close extension pages and ongoing operations.
3. Keep the original installation path and replace its contents completely with the new
   files, avoiding a mixture of old and new assets.
4. Reload the extension at `chrome://extensions/` and check its version number.
5. Refresh pages where you use screenshots or tech-stack detection, then reopen the tool.

Prefer updating the existing directory and reloading instead of uninstalling and
reinstalling, which may lose extension data. Chrome's "Update" button does not download
this ZIP from GitHub.

## Rollback and troubleshooting

- **Need an older version?** Download it from Releases, back up current files and data,
  then follow the update steps. Older code may not understand newer storage formats.
- **Missing Manifest?** Extract the ZIP and select the directory directly containing
  `manifest.json`.
- **Only src and package.json?** You downloaded source code. Select the installation
  asset instead.
- **Latest link returns 404?** Check whether a public release with the named asset exists.
- **Page tools stop responding after an update?** Reload the extension and refresh the page.
- **Managed Chrome blocks Developer mode?** Administrator approval is required; the
  package cannot bypass browser policy.
- **Chrome internal pages cannot be captured or inspected?** Use a normal HTTP(S) page.

See the [official Chrome loading instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
