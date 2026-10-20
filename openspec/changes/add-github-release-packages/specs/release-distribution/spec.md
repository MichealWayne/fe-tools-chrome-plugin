## ADDED Requirements

### Requirement: Validated installable packages

The workflow SHALL check versions, types, lint, tests, builds, and package integrity for
PRs targeting `master` and pushes to `master`. It SHALL upload the ZIP and
`SHA256SUMS.txt` as a temporary artifact for each successful build.

#### Scenario: Build a valid extension

- **WHEN** the package, source manifest and built manifest versions match and referenced
  runtime resources exist
- **THEN** the ZIP root contains `manifest.json` and built runtime files, with hidden
  files excluded and symlinks or unexpected top-level files rejected
- **AND** identical build files yield identical ZIP bytes

#### Scenario: Missing runtime resource

- **WHEN** a worker import, HTML asset, content script or required locale file is missing
- **THEN** packaging fails before any release is created

### Requirement: Master-only draft releases

Only pushes to `master` SHALL create release resources. An unpublished version SHALL
bind `v<version>` to the exact workflow commit and create a Draft Release with both
assets, source identification, and links to the bilingual installation guides.

#### Scenario: New version merged

- **WHEN** a master build succeeds for a version without a Release
- **THEN** it creates a draft and leaves official publication to the maintainer
- **AND** it does not automatically increment the version or mark the draft as Latest

#### Scenario: Pull request build

- **WHEN** a PR targeting master passes its checks
- **THEN** it retains a temporary artifact without write permission to release resources

### Requirement: Existing release preservation

Published releases and complete drafts SHALL remain unchanged. Partial drafts SHALL
resume only for the same source commit and matching existing assets. Release jobs SHALL
be serialized without canceling an in-progress release.

#### Scenario: Ordinary merge keeps the version

- **WHEN** the version already has a published Release or complete draft
- **THEN** the new build only retains its temporary artifact and leaves that release intact

#### Scenario: Interrupted upload

- **WHEN** the same commit is retried with a partial draft and matching existing bytes
- **THEN** it uploads only missing assets without replacing existing ones

#### Scenario: Conflicting tag or partial draft

- **WHEN** an existing tag without a release resolves to another commit, a partial draft
  belongs to another commit, or existing asset bytes differ
- **THEN** release processing fails without replacing or deleting existing resources

### Requirement: Download and installation guidance

The README files SHALL link to a fixed-name installation asset and bilingual guides
covering loading, verification, manual updates, and rollback limits.

#### Scenario: First public release

- **WHEN** a maintainer publishes a tested draft containing the fixed-name ZIP
- **THEN** users can download it through the latest-release link and load its extracted
  Manifest directory without building source code
- **AND** documentation explains that the link is unavailable before that release
