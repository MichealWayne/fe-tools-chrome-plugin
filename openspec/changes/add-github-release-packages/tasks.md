# Implementation tasks

- [x] Add and verify package construction and artifact validation.
- [x] Add and verify draft-release creation, idempotency, and conflict handling.
- [x] Wire build/artifact and master-only draft jobs with scoped permissions.
- [x] Update bilingual download/install instructions and maintainer release workflow.
- [x] Run focused release tests and the full local release checks; prepare commit scope.

Local verification (2026-10-20):

- Full Vitest run: 43 files, 336 tests passed, including 20 release/package tests.
- Typecheck, version check, build, package creation, ZIP integrity, and SHA256 passed.
- Lint: zero errors, six existing `v-html` warnings; targeted ESLint for the new scripts
  and tests passed. Targeted Prettier and local documentation links passed.
- OpenSpec strict validation passed.
- actionlint 1.7.12 does not yet recognize `concurrency.queue`. Its other checks passed
  with only that diagnostic excluded. The `queue: max` / `cancel-in-progress: false`
  combination was checked against the
  [official GitHub schema documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
- Candidate commit paths were scanned for common credential patterns with no matches.
  Commit message and path list were prepared outside the repository. No files were
  staged and no commit, push, tag, Release, or remote workflow was created in this session.

Remote Actions execution, Draft Release creation, and unpacked Chrome smoke testing
must be reported separately from local verification.
