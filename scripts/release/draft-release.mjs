import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ARCHIVE_NAME, CHECKSUM_NAME, readVersion, sha256 } from './package-extension.mjs';

const resolveTagCommit = async (github, repository, tag) => {
  let object;
  try {
    const response = await github.rest.git.getRef({ ...repository, ref: `tags/${tag}` });
    object = response.data.object;
  } catch (error) {
    if (error.status === 404) return undefined;
    throw error;
  }
  // Annotated tags may themselves point to annotated tags.
  for (let depth = 0; object.type === 'tag' && depth < 10; depth++) {
    const response = await github.rest.git.getTag({ ...repository, tag_sha: object.sha });
    object = response.data.object;
  }
  if (object.type !== 'commit') throw new Error(`Tag ${tag} does not resolve to a commit`);
  return object.sha;
};

const releaseNotes = (root, repository, version, commit) => {
  const entry = readFileSync(join(root, 'CHANGELOG.md'), 'utf8')
    .split('\n')
    .find(line => line.includes(`\`v${version}\``));
  if (!entry) throw new Error(`CHANGELOG.md has no entry for v${version}`);
  const base = `https://github.com/${repository.owner}/${repository.repo}`;
  return [
    `## v${version}`,
    '',
    entry,
    '',
    '## Download and install / 下载安装',
    '',
    `Download **${ARCHIVE_NAME}** below, extract it, then load the folder containing`,
    '`manifest.json` at `chrome://extensions/` with Developer mode enabled.',
    '',
    `下载下方 **${ARCHIVE_NAME}**，解压后在 Chrome 扩展管理页开启开发者模式，`,
    '点击“加载已解压的扩展程序”，选择包含 `manifest.json` 的目录。',
    '',
    'GitHub Source code archives require building; use the installation ZIP above.',
    'GitHub 自动生成的 Source code 压缩包是源码，请下载上述安装包。',
    '',
    `- [中文安装与更新说明](${base}/blob/${commit}/docs/installation.md)`,
    `- [English installation and update guide](${base}/blob/${commit}/docs/installation.en.md)`,
    `- Verify the ZIP against **${CHECKSUM_NAME}** / 可使用校验文件检查下载完整性`,
    '',
    `Source commit: ${commit}`,
    `<!-- source-sha: ${commit} -->`,
    '',
    '> Maintainer: this is a draft. Test the attached package in Chrome before publishing.',
    '> 维护者：这是草稿，请验证附件安装包后再手动发布。',
  ].join('\n');
};

/** Creates drafts only; existing published releases and complete drafts are immutable here. */
export const createDraftRelease = async ({
  github,
  owner,
  repo,
  commit,
  root = process.cwd(),
  bundleDir = join(root, 'release-artifacts'),
}) => {
  if (!/^[a-f\d]{40}$/.test(commit)) throw new Error('A full workflow commit SHA is required');
  const repository = { owner, repo };
  const version = readVersion(root);
  const tag = `v${version}`;
  const archive = readFileSync(join(bundleDir, ARCHIVE_NAME));
  const checksum = readFileSync(join(bundleDir, CHECKSUM_NAME));
  if (checksum.toString('utf8') !== `${sha256(archive)}  ${ARCHIVE_NAME}\n`) {
    throw new Error('Release package checksum does not match');
  }
  const files = [
    { name: ARCHIVE_NAME, data: archive, type: 'application/zip' },
    { name: CHECKSUM_NAME, data: checksum, type: 'text/plain' },
  ];

  const releases = await github.paginate(github.rest.repos.listReleases, {
    ...repository,
    per_page: 100,
  });
  const matching = releases.filter(release => release.tag_name === tag);
  if (matching.length > 1) throw new Error(`Multiple releases exist for ${tag}; resolve manually`);
  let release = matching[0];
  if (release && !release.draft) return { status: 'published-exists', tag };
  const assets = release
    ? await github.paginate(github.rest.repos.listReleaseAssets, {
        ...repository,
        release_id: release.id,
        per_page: 100,
      })
    : [];
  const complete = files.every(file =>
    assets.some(asset => asset.name === file.name && asset.state === 'uploaded')
  );
  if (release && complete) return { status: 'draft-exists', tag };
  if (
    release &&
    (release.target_commitish !== commit ||
      !release.body?.includes(`<!-- source-sha: ${commit} -->`))
  ) {
    throw new Error(`Partial draft ${tag} belongs to a different commit; bump the version`);
  }

  const taggedCommit = await resolveTagCommit(github, repository, tag);
  if (taggedCommit && taggedCommit !== commit) {
    throw new Error(`Tag ${tag} points to a different commit; no release was changed`);
  }
  // Validate any existing bytes before uploading anything else to a partial draft.
  for (const file of files) {
    const asset = assets.find(item => item.name === file.name);
    if (!asset) continue;
    let digest = asset.digest;
    if (!digest) {
      const response = await github.rest.repos.getReleaseAsset({
        ...repository,
        asset_id: asset.id,
        headers: { accept: 'application/octet-stream' },
      });
      digest = `sha256:${sha256(Buffer.from(response.data))}`;
    }
    if (asset.state !== 'uploaded' || digest !== `sha256:${sha256(file.data)}`) {
      throw new Error(`Existing asset ${file.name} differs; no assets were replaced`);
    }
  }
  const body = releaseNotes(root, repository, version, commit);
  if (!taggedCommit) {
    await github.rest.git.createRef({ ...repository, ref: `refs/tags/${tag}`, sha: commit });
  }
  const resumed = Boolean(release);
  if (!release) {
    const response = await github.rest.repos.createRelease({
      ...repository,
      tag_name: tag,
      target_commitish: commit,
      name: tag,
      body,
      draft: true,
      prerelease: false,
      make_latest: 'false',
    });
    release = response.data;
  }
  for (const file of files) {
    if (assets.some(asset => asset.name === file.name)) continue;
    await github.rest.repos.uploadReleaseAsset({
      ...repository,
      release_id: release.id,
      name: file.name,
      data: file.data,
      headers: { 'content-type': file.type, 'content-length': file.data.length },
    });
  }
  return { status: resumed ? 'resumed' : 'created', tag };
};
