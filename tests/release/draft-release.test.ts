import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDraftRelease } from '../../scripts/release/draft-release.mjs';

const commit = 'a'.repeat(40);
const otherCommit = 'b'.repeat(40);
const directories: string[] = [];
const fixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'draft-release-test-'));
  directories.push(root);
  const archiveName = 'fe-tools-chrome-extension.zip';
  const zip = Buffer.from('archive fixture');
  const digest = createHash('sha256').update(zip).digest('hex');
  const checksum = Buffer.from(`${digest}  ${archiveName}\n`);
  writeFileSync(join(root, 'package.json'), '{"version":"1.8.0"}');
  writeFileSync(
    join(root, 'CHANGELOG.md'),
    '# Change Log\n\n- 2026.10.20: `v1.8.0`，发布流程升级；\n- 2026.09.26: `v1.7.0`，旧记录；\n'
  );
  writeFileSync(join(root, archiveName), zip);
  writeFileSync(join(root, 'SHA256SUMS.txt'), checksum);
  const release = {
    id: 42,
    tag_name: 'v1.8.0',
    target_commitish: commit,
    body: `<!-- source-sha: ${commit} -->`,
    draft: true,
  };
  const asset = (name: string, data: Buffer) => ({
    id: name === archiveName ? 1 : 2,
    name,
    state: 'uploaded',
    digest: `sha256:${createHash('sha256').update(data).digest('hex')}`,
  });
  const github = {
    paginate: vi.fn(async (method: unknown) => {
      if (method === github.rest.repos.listReleases) return [];
      return [];
    }),
    rest: {
      repos: {
        listReleases: vi.fn(),
        listReleaseAssets: vi.fn(),
        createRelease: vi.fn().mockResolvedValue({ data: release }),
        uploadReleaseAsset: vi.fn().mockResolvedValue({ data: {} }),
        getReleaseAsset: vi.fn(),
      },
      git: {
        getRef: vi.fn().mockRejectedValue({ status: 404 }),
        getTag: vi.fn(),
        createRef: vi.fn().mockResolvedValue({}),
      },
    },
  };
  const existing = (releases: unknown[], assets: unknown[] = []) => {
    github.paginate.mockImplementation(async method =>
      method === github.rest.repos.listReleases ? releases : assets
    );
  };
  const run = () =>
    createDraftRelease({ github, root, bundleDir: root, owner: 'owner', repo: 'repo', commit });
  return { root, run, github, existing, release, asset, archiveName, zip, checksum };
};

afterEach(() =>
  directories.splice(0).forEach(root => rmSync(root, { recursive: true, force: true }))
);

describe('draft releases', () => {
  it('binds a new tag to the exact commit and creates an unpublished release with both assets', async () => {
    const { run, github } = fixture();
    expect(await run()).toMatchObject({ status: 'created', tag: 'v1.8.0' });
    expect(github.rest.git.createRef).toHaveBeenCalledWith(
      expect.objectContaining({ ref: 'refs/tags/v1.8.0', sha: commit })
    );
    const payload = github.rest.repos.createRelease.mock.calls[0][0];
    expect(payload).toMatchObject({
      tag_name: 'v1.8.0',
      target_commitish: commit,
      draft: true,
      prerelease: false,
      make_latest: 'false',
    });
    expect(payload.body).toContain('发布流程升级');
    expect(payload.body).not.toContain('旧记录');
    expect(payload.body).toContain(`/blob/${commit}/docs/installation.md`);
    expect(payload.body).toContain(`/blob/${commit}/docs/installation.en.md`);
    expect(github.rest.repos.uploadReleaseAsset.mock.calls.map(call => call[0].name)).toEqual([
      'fe-tools-chrome-extension.zip',
      'SHA256SUMS.txt',
    ]);
  });

  it('never changes a published version when later master commits retain its version', async () => {
    const { run, github, existing, release } = fixture();
    existing([{ ...release, draft: false, target_commitish: otherCommit }]);
    expect(await run()).toMatchObject({ status: 'published-exists' });
    expect(github.rest.git.createRef).not.toHaveBeenCalled();
    expect(github.rest.repos.createRelease).not.toHaveBeenCalled();
    expect(github.rest.repos.uploadReleaseAsset).not.toHaveBeenCalled();
  });

  it('keeps a complete draft unchanged across ordinary merges and workflow reruns', async () => {
    const { run, github, existing, release, asset, archiveName, zip, checksum } = fixture();
    existing(
      [{ ...release, target_commitish: otherCommit }],
      [asset(archiveName, zip), asset('SHA256SUMS.txt', checksum)]
    );
    expect(await run()).toMatchObject({ status: 'draft-exists' });
    expect(github.rest.repos.uploadReleaseAsset).not.toHaveBeenCalled();
  });

  it('resumes a partial draft for the same commit without overwriting its existing ZIP', async () => {
    const { run, github, existing, release, asset, archiveName, zip } = fixture();
    existing([release], [asset(archiveName, zip)]);
    github.rest.git.getRef.mockResolvedValue({ data: { object: { type: 'commit', sha: commit } } });
    expect(await run()).toMatchObject({ status: 'resumed' });
    expect(github.rest.repos.createRelease).not.toHaveBeenCalled();
    expect(github.rest.repos.uploadReleaseAsset).toHaveBeenCalledTimes(1);
    expect(github.rest.repos.uploadReleaseAsset.mock.calls[0][0].name).toBe('SHA256SUMS.txt');
  });

  it('stops a partial draft from a different commit without remote writes', async () => {
    const { run, github, existing, release } = fixture();
    existing([{ ...release, target_commitish: otherCommit }]);
    await expect(run()).rejects.toThrow(/different commit/i);
    expect(github.rest.git.createRef).not.toHaveBeenCalled();
    expect(github.rest.repos.uploadReleaseAsset).not.toHaveBeenCalled();
  });

  it('rejects a conflicting tag before creating a release', async () => {
    const { run, github } = fixture();
    github.rest.git.getRef.mockResolvedValue({
      data: { object: { type: 'commit', sha: otherCommit } },
    });
    await expect(run()).rejects.toThrow(/tag.*different commit/i);
    expect(github.rest.repos.createRelease).not.toHaveBeenCalled();
    expect(github.rest.git.createRef).not.toHaveBeenCalled();
  });

  it('accepts an annotated tag resolving to the same workflow commit', async () => {
    const { run, github } = fixture();
    github.rest.git.getRef.mockResolvedValue({
      data: { object: { type: 'tag', sha: otherCommit } },
    });
    github.rest.git.getTag.mockResolvedValue({ data: { object: { type: 'commit', sha: commit } } });
    await expect(run()).resolves.toMatchObject({ status: 'created' });
    expect(github.rest.git.createRef).not.toHaveBeenCalled();
  });

  it('does not attach a checksum to mismatching ZIP bytes left by an interrupted run', async () => {
    const { run, github, existing, release, asset, archiveName } = fixture();
    existing([release], [asset(archiveName, Buffer.from('other bytes'))]);
    github.rest.git.getRef.mockResolvedValue({ data: { object: { type: 'commit', sha: commit } } });
    await expect(run()).rejects.toThrow(/asset.*differs/i);
    expect(github.rest.repos.uploadReleaseAsset).not.toHaveBeenCalled();
  });

  it('verifies an existing asset by downloading its bytes when GitHub has no digest', async () => {
    const { run, github, existing, release, asset, archiveName, zip } = fixture();
    existing([release], [{ ...asset(archiveName, zip), digest: null }]);
    github.rest.git.getRef.mockResolvedValue({
      data: { object: { type: 'commit', sha: commit } },
    });
    github.rest.repos.getReleaseAsset.mockResolvedValue({ data: zip });
    await expect(run()).resolves.toMatchObject({ status: 'resumed' });
    expect(github.rest.repos.getReleaseAsset).toHaveBeenCalledOnce();
    expect(github.rest.repos.uploadReleaseAsset).toHaveBeenCalledOnce();
  });

  it('does not leave a tag when release notes for the new version are missing', async () => {
    const { root, run, github } = fixture();
    writeFileSync(join(root, 'CHANGELOG.md'), '# Change Log\n');
    await expect(run()).rejects.toThrow(/changelog/i);
    expect(github.rest.git.createRef).not.toHaveBeenCalled();
    expect(github.rest.repos.createRelease).not.toHaveBeenCalled();
  });

  it('fails before any remote request when the local checksum is wrong', async () => {
    const { root, run, github } = fixture();
    writeFileSync(join(root, 'fe-tools-chrome-extension.zip'), 'changed after packaging');
    await expect(run()).rejects.toThrow(/checksum/i);
    expect(github.paginate).not.toHaveBeenCalled();
  });

  it('reports authorization errors instead of treating them as a missing tag', async () => {
    const { run, github } = fixture();
    github.rest.git.getRef.mockRejectedValue({ status: 403 });
    await expect(run()).rejects.toMatchObject({ status: 403 });
    expect(github.rest.repos.createRelease).not.toHaveBeenCalled();
  });
});
