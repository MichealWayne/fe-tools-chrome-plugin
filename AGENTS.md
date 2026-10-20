# Repository Guidelines

## Project Overview

- This repository builds a Chrome extension toolbox for frontend developers.
- The extension uses Chrome Manifest V3. The popup is the Vite/Vue application, while
  extension service-worker and content-script code lives under `public/scripts/`.
- Primary stack: Vue 3, TypeScript, Vite, Less, Chrome Extension APIs, and Vitest with
  jsdom.
- Use `pnpm`. `pnpm-lock.yaml` is the authoritative lockfile, and CI installs with
  `pnpm install --frozen-lockfile` on Node.js 20.

## Repository Map

- `src/main.ts`, `src/views/app.vue`: Vue application entry points.
- `src/views/`: top-level popup views and main navigation/search behavior.
- `src/components/<Feature>/`: feature UI plus feature-local helpers, composables, and
  styles.
- `src/components/Experience/`: shared workspace, state, and feedback primitives.
- `src/api/`: remote API access. Reuse the existing client instead of creating ad hoc
  request wrappers.
- `src/utils/`: shared browser, formatting, sanitization, i18n, and data helpers.
- `src/types/`: shared interfaces and domain types.
- `src/styles/`: global styles and design-system tokens.
- `public/manifest.json`: extension metadata, permissions, scripts, and version.
- `public/scripts/`: plain JavaScript executed by Chrome as background/content scripts;
  these files are not bundled as Vue modules.
- `public/_locales/`: Chrome extension locale message catalogs.
- `tests/`: Vitest suites, grouped by components, views, utilities, API, and extension
  behavior. Shared browser mocks are initialized by `tests/setup.ts`.
- `scripts/release/`, `tests/release/`: package validation and Draft Release creation;
  packaging needs `zip`, and package tests also need `unzip`.
- `docs/installation*.md`, `docs/releasing.md`: user installation/update guides and
  maintainer release operations.
- `openspec/`: accepted project specifications and active change artifacts. Consult the
  relevant spec/change before modifying behavior covered there.
- `dist/`: generated build output; do not edit it by hand or commit it.

## Common Commands

```sh
pnpm install --frozen-lockfile
pnpm run dev              # Vite dev server on http://localhost:8080
pnpm run test:run         # run the full Vitest suite once
pnpm run test:run -- tests/path/to/file.test.ts
pnpm run typecheck        # vue-tsc --noEmit
pnpm run lint:check       # lint src without auto-fixing
pnpm run check:version    # package.json and manifest versions must match
pnpm run build            # production extension build in dist/
pnpm run package:extension # validate dist/, create ZIP and SHA256 in release-artifacts/
```

Use `pnpm run lint:fix` or `pnpm run prettier` only when the task calls for broad
formatting. They can rewrite many files, so prefer targeted edits in a dirty worktree.

## Implementation Conventions

- Follow `.editorconfig` and Prettier: two-space indentation, LF endings, single quotes,
  semicolons, a 100-column print width, and trailing commas where supported.
- Prefer TypeScript for new application logic. Give public APIs and shared data structures
  explicit types; avoid introducing new `any` where a concrete type is practical.
- Use PascalCase for Vue components and camelCase for functions and variables.
- Prefer Vue Composition API and `<script setup lang="ts">` for new components, matching
  nearby files when modifying an existing component.
- Use the `@/` alias for imports from `src/`. Reuse configured Vue/Vue Router/VueUse
  auto-imports and component auto-registration where they keep code consistent.
- Keep feature-specific logic beside its component. Put broadly reused code in `src/utils`
  or shared types in `src/types`, and preserve stable re-exports when splitting modules.
- Keep components focused. When a Vue file approaches 500 lines, extract coherent
  subcomponents or composables rather than extending a monolith.
- Reuse design tokens and shared experience components before adding one-off UI patterns.
- Add short comments for non-obvious intent only; use JSDoc for exported utilities or
  significant component logic.
- Do not reformat or refactor unrelated code as part of a focused change.

## Chrome Extension Constraints

- Treat `public/manifest.json` permission, host-permission, service-worker, content-script,
  and locale changes as extension-wide behavior changes. Keep permissions least-privilege
  and explain any addition.
- Code may run in three different contexts: popup DOM, background service worker, and web
  page content script. Do not assume DOM, `window`, or every `chrome.*` API exists in all
  contexts.
- Preserve message contracts between Vue code, `backgroundV3.js`, and
  `content-script-v3.js`; update both producers and consumers together.
- Treat remote data, bookmarks, page content, stored data, and user input as untrusted.
  Sanitize HTML/SVG before rendering and do not introduce `eval` or dynamic script
  injection.
- Do not expose secrets, authorization data, or raw sensitive errors in UI, logs, storage,
  fixtures, or committed files.
- User-visible extension metadata belongs in `public/_locales/en/messages.json` and
  `public/_locales/zh_CN/messages.json`. Keep both catalogs in sync.
- When changing the extension version, update both `package.json` and
  `public/manifest.json`; verify with `pnpm run check:version`.

## Testing and Verification

- Use Vitest and Vue Test Utils. Place tests under `tests/` following the existing
  feature-oriented structure and use the `*.test.ts` suffix.
- Add or update focused tests for behavior changes, especially parsing, sanitization,
  storage, messaging, localization, and Chrome API fallbacks.
- Prefer observable behavior over implementation details. Use the Chrome mocks from
  `tests/setup.ts` and reset mocks/storage between tests to prevent leakage.
- During development, run the smallest relevant suite. Before handing off a material
  change, run the affected tests plus `pnpm run typecheck` and `pnpm run lint:check`.
- For release-sensitive changes, match CI's full gate:

  ```sh
  pnpm run typecheck
  pnpm run check:version
  pnpm run lint:check
  pnpm run test:run
  pnpm run build
  pnpm run package:extension
  ```

- UI or extension-context changes also require manual verification in an unpacked Chrome
  extension when automated tests cannot exercise the real browser API or lifecycle. Report
  clearly when that verification was not performed.

- PRs targeting `master` build read-only; pushes to `master` may create a Draft Release
  after checks. Published versions and complete drafts are never overwritten. Test the
  attached ZIP in Chrome before manually publishing. Keep `release-artifacts/` out of Git.

## OpenSpec and Scope

- For a new feature, breaking behavior change, or cross-cutting architecture change, check
  `openspec/specs/` and create or update an artifact under `openspec/changes/` before
  implementation when the existing workflow requires it.
- Preserve explicit scope boundaries and decisions recorded in an active OpenSpec change.
- Do not edit archived changes except to correct documentation history explicitly requested
  by the user.

## Git and Handoff

- Preserve unrelated worktree changes. Stage only task-owned paths; never use `git add .`
  in a dirty worktree.
- Use scoped, descriptive Conventional Commit messages consistent with repository history,
  such as `fix(popup): ...`, `feat(search): ...`, or `test(i18n): ...`.
- Do not amend, rewrite history, change branches, or commit unless the user requests it or
  the active workflow explicitly requires it.
- In the handoff, state what changed, the exact checks run and their results, anything not
  verified, and any remaining extension permission, browser-lifecycle, or release risk.
