# GitHub release packages

Build installable extension packages after pushes to `master` (including PR merges).
Keep ordinary builds as temporary Actions artifacts. A new version creates a Draft
Release with a ZIP and SHA256 checksum; a maintainer tests and publishes it manually.

Keep the existing pnpm/Node 20 toolchain. Never replace a published version or
automatically increment versions. No Chrome Web Store integration, remote publication
from this implementation session, or unrelated application fixes are in scope.

The ZIP contains the contents of `dist/` at its root. Chinese and English installation
guides distinguish the installable package from GitHub's source archives and explain
manual updates, rollback limits, and the first-release download-link prerequisite.
