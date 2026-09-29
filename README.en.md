# FrontEnd Tools Chrome Plugin

A Chrome extension toolbox for frontend developers, built with Manifest V3, Vue 3, and Vite.

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

Detection results are grouped by `framework`, `bundler`, and `library`, and display `high`, `medium`, or `low` confidence levels together with the matched evidence.

## Settings

- Language: supports switching between Chinese and English.
- Pinyin search: enabled by default. When disabled, search only matches literal Chinese text, English text, URLs, and similar original content.
- Codex quota: requires a signed-in ChatGPT account. Quota data is cached locally, with links to the Codex usage dashboard and reset tracker.

## Installation

### Build and install locally

```sh
pnpm install
pnpm run build
```

After the build is complete, open `chrome://extensions/` in Chrome:

1. Enable "Developer mode".
2. Click "Load unpacked".
3. Select the build output directory `dist`.

You can also refer to the legacy installation guide: [Install >>](https://github.com/MichealWayne/fe-tools/tree/master/chrome-extension). Download the directory files locally for offline installation, or follow this [installation tutorial](https://blog.csdn.net/jbk3311/article/details/103894936).

## Development

Requirements:

- Node.js 20 or later.
- pnpm is recommended. This repository includes `pnpm-lock.yaml`.

Install dependencies:

```sh
pnpm install
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

## Project Structure

```text
public/
  manifest.json              Chrome Manifest V3 configuration
  scripts/                   Extension background, content script, and shared scripts
src/
  api/                       Remote data API wrappers
  assets/                    Static assets such as tool entry icons
  components/                Tool components
  extension/                 Chrome message types and API client
  styles/                    Global styles and design system
  utils/                     Shared utilities, Chrome APIs, i18n, JSON formatting, and more
  views/                     Main page, Moo-CSS, regex, and utility function pages
tests/                       Vitest unit tests
```

## Milestones

- 2026: Tailwind-to-CSS conversion, Codex quota monitoring, Postman workspace improvements, enhanced tech-stack detection, and extension localization.
- 2025: Manifest V3, page screenshots, bilingual support.
- 2019: Extension v1.
