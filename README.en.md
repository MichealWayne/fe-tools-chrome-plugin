# FrontEnd Tools Chrome Plugin

A Chrome extension toolbox for frontend developers, built with Manifest V3, Vue 3, and Vite.

Current version: **1.8.0** · [中文](README.md) · [Changelog](CHANGELOG.md)

[Download Latest](https://github.com/MichealWayne/fe-tools-chrome-plugin/releases/latest/download/fe-tools-chrome-extension.zip) · [Installation and Updates](docs/installation.en.md) · [All Releases](https://github.com/MichealWayne/fe-tools-chrome-plugin/releases)

Install the built package without Node.js or a local build. The download link becomes available after the first public release containing this asset. Draft releases are for maintainer verification and are not public downloads.

## A small extension that helps frontend development

![chrome-ext.png](https://blog.michealwayne.cn/images/fe-tools/chrome-ext.png)

## Features

- Developer resource search: MDN, GitHub, npm, Can I Use, Stack Overflow, Google, and Baidu.
- Local bookmark search: read Chrome bookmarks and search them in one place inside the extension.
- Pinyin search: Chinese tools and bookmarks support pinyin and initials matching, which can be disabled in settings.
- CSS property / Moo-CSS search: search CSS properties, Moo-CSS variables, methods, and class names.
- URL to QR code: generate QR codes and download them as images.
- Image compression and Base64 conversion: choose JPEG or PNG output and view the compressed dimensions.
- Tailwind class-to-CSS conversion: supports a bounded set of common Tailwind v3 utilities, arbitrary values, and variants such as `sm`/`md`/`lg`/`xl`/`2xl` and `hover`/`focus`. Copy the generated CSS and see which classes were not recognized.
- px/rem/vw unit calculator.
- RGB/HSB/HSL/HEX/CMYK color conversion.
- Quick translation.
- Lightweight Postman: supports request headers, request body, authentication, environment variable substitution, saved requests, cURL import/export, history filtering, cancellation/timeouts, validation, and response search.
- Common regex lookup and testing.
- JSON formatting and validation.
- Online SVG editor and optimizer.
- Date and timestamp conversion.
- Linux command lookup.
- Page screenshots: capture full pages or specific nodes and save the result.
- Tech stack detection: combine scripts, resources, DOM, globals, runtime signals, and meta tags to identify common frameworks, build tools, and frontend libraries, with versions, evidence, and confidence levels.
- Codex quota: view ChatGPT Codex allowance windows, remaining quota, and reset times with caching, auto-refresh, and low-quota/reset notifications.
- Utility function library search.
- Chinese and English UI switching.

## Tech Stack Detection Coverage

The current tech stack detection mainly covers:

- Frameworks: Vue, React, Angular, Next.js, Nuxt, Svelte, Preact, SolidJS, Astro, Gatsby, Remix, Alpine.js, Stimulus, Ember, Backbone, and jQuery.
- Build tools: Vite and Webpack.
- Common libraries: axios, redux, vue-router, react-router, angular router, vuex, pinia, mobx, zustand, TanStack Query, Apollo Client, and RxJS.

Detection results are grouped by `framework`, `bundler`, and `library`, with confidence levels, matched evidence, version sources, and version conflicts. Copy a summary or JSON report. Framework coverage also includes AngularJS.

Only the target tab's main frame is inspected; iframes are not scanned recursively. The UI reports DOM/isolated-world and page-runtime coverage separately. Missing detections or unknown versions do not prove a technology is absent. Reports strip URL credentials, query parameters, and fragments; review paths and other content before sharing.

## Updated Tool Workflows

- Page context menu: generate a QR code for the current URL, open Youdao translation, detect the current page's tech stack, or capture the full page/an element. QR codes and tech-stack detection open dedicated tool pages.
- Screenshots: element selection continues inside the page after the popup closes, then opens a preview. Full-page context-menu captures run in a background task tab that becomes active when finished. Keep the target page visible during capture. Restricted pages such as Chrome internal pages are unsupported. Full-page captures are limited to 40 segments and 25 million pixels; exceeding either limit produces an error.
- QR codes: enlarge to 320/480/640px for scanning or open a dedicated scan page. Regenerate after editing the content before enlarging or downloading.
- Images and SVG: compare the original/compressed image, file sizes, and savings. Image, screenshot, and SVG previews support zoom and pan; SVG previews offer background selection.
- JSON: import strict JSON files up to 2 MiB, download results, search input/output text, and navigate to parser errors. Error navigation depends on positions supplied by the browser parser. Search uses literal matching and caps results at 10000 matches.
- JSON, SVG, and Tailwind: text drafts survive tool switching within the current popup. Closing the popup clears them; drafts are not persisted or shared across windows. Each draft is capped at 2097152 characters.
- Colors and dates: accept common opaque CSS forms such as `#abc`, `rgb(255, 0, 0)`, and `hsl(0, 100%, 50%)`; alpha is unsupported. Date conversion supports individual result copying and seconds/milliseconds hints.

## Permissions and Data

The extension requests access to all HTTP(S) sites for cross-site requests, page inspection, and screenshots. Bookmarks enable local search; storage holds settings, request data, and quota caches. Alarms/notifications support Codex quota monitoring, downloads save results, and context-menu/scripting permissions enable page tools.

QR, JSON, SVG, color, and image conversions run locally. Translation, API requests, remote reference data, and Codex quota queries require network access. Check reports, requests, and screenshots for sensitive information before sharing.

## Settings

- Language: supports switching between Chinese and English.
- Pinyin search: enabled by default. When disabled, search only matches literal Chinese text, English text, URLs, and similar original content.
- Codex quota: requires a signed-in ChatGPT account. Quota data is cached locally, with links to the Codex usage dashboard and reset tracker.

## Installation

### Download the built package (recommended)

1. [Download the latest package](https://github.com/MichealWayne/fe-tools-chrome-plugin/releases/latest/download/fe-tools-chrome-extension.zip), or select `fe-tools-chrome-extension.zip` from [Releases](https://github.com/MichealWayne/fe-tools-chrome-plugin/releases).
2. Extract it into a permanent directory. GitHub's generated `Source code` archives require building and are not installation packages.
3. Enter `chrome://extensions/` in Chrome's address bar and enable Developer mode.
4. Click "Load unpacked" and select the directory directly containing `manifest.json`.
5. Pin the extension to the toolbar. Keep the installation directory; updates require downloading the new package and reloading the extension manually.

See [Installation and Updates](docs/installation.en.md) for detailed steps, checksum verification, and troubleshooting.

### Build from source (developers)

```sh
pnpm install --frozen-lockfile
pnpm run build
```

After the build is complete, open `chrome://extensions/` in Chrome:

1. Enable "Developer mode".
2. Click "Load unpacked".
3. Select the build output directory `dist`.

## Development

Requirements:

- Node.js 20 or later.
- Use pnpm (CI uses pnpm 9). This repository includes `pnpm-lock.yaml`.

Install dependencies:

```sh
pnpm install --frozen-lockfile
```

Run locally:

```sh
pnpm run dev
```

After the dev server starts, visit `http://localhost:8080/` or the Vite URL shown in the terminal.

Build:

```sh
pnpm run build
```

Type check:

```sh
pnpm run typecheck
```

Lint:

```sh
pnpm run lint:check
pnpm run lint:fix
```

Unit tests:

```sh
pnpm run test
pnpm run test:run
pnpm run test:coverage
```

Run the complete checks before release:

```sh
pnpm run typecheck
pnpm run check:version
pnpm run lint:check
pnpm run test:run
pnpm run build
pnpm run package:extension
```

Keep versions in `package.json` and `public/manifest.json` synchronized. The development server is for UI debugging; bookmarks, context menus, screenshots, notifications, and service-worker lifecycle require loading `dist/` in Chrome. Reload the extension after rebuilding, and refresh target pages when necessary.

After building, `package:extension` validates versions and runtime references, then writes the ZIP and SHA256 checksum to `release-artifacts/`. A local `zip` command is required. Neither this directory nor `dist/` is committed.

PRs and pushes to `master` run checks and retain build artifacts for 14 days. Only pushes to `master` can create a Draft Release for an unpublished version. Published releases and complete drafts remain unchanged; a maintainer tests the attachment before publishing manually. See the [maintainer release workflow](docs/releasing.md).

## Project Structure

```text
public/
  manifest.json              Chrome Manifest V3 configuration
  scripts/                   Extension background, content script, and shared scripts
src/
  api/                       Remote data API wrappers
  assets/                    Static assets such as tool entry icons
  components/                Tool components
  composables/               Copy feedback and popup-local text draft composables
  extension/                 Chrome message types and API client
  styles/                    Global styles and design system
  utils/                     Shared utilities, Chrome APIs, i18n, JSON formatting, and more
  views/                     Main page, Moo-CSS, regex, and utility function pages
tests/                       Vitest unit tests
scripts/release/             Package validation, ZIP creation, and Draft Release logic
docs/                        Bilingual installation guides and maintainer release workflow
openspec/changes/            Release distribution requirements and change records
```

## Milestones

- 2026: Context-menu screenshots and dedicated tool pages, result previews and JSON workbench, tech-stack reports, Tailwind-to-CSS conversion, Codex quota monitoring, Postman workspace improvements, and extension localization.
- 2025: Manifest V3, page screenshots, bilingual support.
- 2019: Extension v1.
