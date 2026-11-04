import { createHash, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as tar from 'tar';
import { root, catalogue } from './context.mjs';

export function validateRelease(sdk, metadata) {
  if (metadata.name !== sdk.packageName || !/^\d+\.\d+\.\d+$/.test(metadata.version)) throw new Error(`Invalid stable release for ${sdk.packageName}`);
  const repository = typeof metadata.repository === 'string' ? metadata.repository : metadata.repository?.url;
  if (repository?.replace(/^git\+/, '').replace(/\.git$/, '') !== sdk.repository) throw new Error(`Unexpected repository for ${sdk.packageName}`);
  if (!/^https:\/\/registry\.npmjs\.org\//.test(metadata.dist?.tarball || '') || !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(metadata.dist?.integrity || '')) throw new Error(`Missing trusted npm archive/integrity for ${sdk.packageName}`);
  if (metadata.gitHead && !/^[a-f0-9]{40}$/.test(metadata.gitHead)) throw new Error('Invalid npm gitHead');
  return { packageName: metadata.name, version: metadata.version, repository: sdk.repository,
    npmTarball: metadata.dist.tarball, npmIntegrity: metadata.dist.integrity, ...(metadata.gitHead ? { gitHead: metadata.gitHead } : {}) };
}

export function versionsChanged(releases, manifest) {
  return Object.entries(releases).some(([id, release]) => (manifest?.releases?.[id]?.version ?? manifest?.sdks?.[id]?.version) !== release.version);
}

async function fetchBytes(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000), headers: { 'User-Agent': 'siebly-sdk-docs' } });
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

export function verifyIntegrity(bytes, integrity) {
  const expected = Buffer.from(integrity.slice('sha512-'.length), 'base64');
  const actual = createHash('sha512').update(bytes).digest();
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('npm archive integrity mismatch');
}

export function validateArchiveEntries(entries) {
  let top;
  for (const { path: filename, type } of entries) {
    const parts = filename.replace(/\/$/, '').split('/');
    if (filename.includes('\\') || parts.some((part) => !part || part === '.' || part === '..') || !['File', 'Directory'].includes(type)) throw new Error(`Unsafe archive entry: ${filename} (${type})`);
    top ??= parts[0];
    if (parts[0] !== top) throw new Error('Archive must have one root directory');
  }
  if (!top) throw new Error('Empty source archive');
}

async function unpack(file, destination) {
  const entries = [];
  await tar.t({ file, onReadEntry: (entry) => entries.push({ path: entry.path, type: entry.type }) });
  validateArchiveEntries(entries);
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  await tar.x({ file, cwd: destination, strip: 1, preserveOwner: false, noChmod: true });
}

async function hasSource(directory, sdk) {
  try { await access(path.join(directory, sdk.entryPoint)); await access(path.join(directory, sdk.tsconfig)); return true; }
  catch { return false; }
}

export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} failed (${code})`)));
  });
}

export async function resolveLatest() {
  const releases = {};
  for (const sdk of await catalogue()) {
    const metadata = JSON.parse(await fetchBytes(`https://registry.npmjs.org/${encodeURIComponent(sdk.packageName)}/latest`));
    releases[sdk.id] = validateRelease(sdk, metadata);
  }
  return releases;
}

export async function prepare(releases) {
  const records = {};
  for (const sdk of await catalogue()) {
    const release = releases[sdk.id];
    // Validate persisted records too; the allowlist always comes from authored config.
    validateRelease(sdk, { name: release.packageName, version: release.version, repository: release.repository, gitHead: release.gitHead, dist: { tarball: release.npmTarball, integrity: release.npmIntegrity } });
    const directory = path.join(root, '.work/releases', sdk.id);
    const sourcePath = path.join(directory, 'source');
    await mkdir(directory, { recursive: true });
    const archive = path.join(directory, 'npm.tgz');
    const bytes = await fetchBytes(release.npmTarball);
    verifyIntegrity(bytes, release.npmIntegrity);
    await writeFile(archive, bytes);
    await unpack(archive, sourcePath);
    let source = { kind: 'npm', url: release.npmTarball };
    if (!await hasSource(sourcePath, sdk)) {
      if (!release.gitHead) throw new Error(`${sdk.id}: npm archive lacks source and npm metadata has no exact gitHead`);
      const sourceUrl = `https://codeload.github.com/${new URL(sdk.repository).pathname.slice(1)}/tar.gz/${release.gitHead}`;
      const githubArchive = path.join(directory, 'source.tgz');
      await writeFile(githubArchive, await fetchBytes(sourceUrl));
      await unpack(githubArchive, sourcePath);
      source = { kind: 'github', url: sourceUrl, commit: release.gitHead };
    }
    const pkg = JSON.parse(await readFile(path.join(sourcePath, 'package.json'), 'utf8'));
    if (pkg.name !== release.packageName || pkg.version !== release.version || !await hasSource(sourcePath, sdk)) throw new Error(`${sdk.id}: source package or compiler config does not match ${release.packageName}@${release.version}`);
    console.log(`Preparing ${release.packageName}@${release.version} from ${source.kind}`);
    let locked = true;
    try { await access(path.join(sourcePath, 'package-lock.json')); } catch { locked = false; }
    await run('npm', [locked ? 'ci' : 'install', '--ignore-scripts', '--include=dev', '--no-audit', '--no-fund', '--cache', path.join(root, 'tmp/npm-cache')], { cwd: sourcePath, env: { ...process.env, npm_config_ignore_scripts: 'true', npm_config_cache: path.join(root, 'tmp/npm-cache') } });
    records[sdk.id] = { ...release, source, sourcePath };
  }
  await writeFile(path.join(root, '.work/releases.json'), JSON.stringify(records, null, 2) + '\n');
  return records;
}

async function main() {
  const command = process.argv[2];
  if (!['check', 'build'].includes(command) || process.argv.length > 3) throw new Error('Usage: node scripts/releases.mjs check|build');
  await mkdir(path.join(root, '.work'), { recursive: true });
  const releases = command === 'build' && process.env.DOCS_RELEASE_RECORD
    ? JSON.parse(await readFile(path.resolve(process.env.DOCS_RELEASE_RECORD), 'utf8'))
    : await resolveLatest();
  console.log(JSON.stringify(releases, null, 2));
  await writeFile(path.join(root, '.work/available-releases.json'), JSON.stringify(releases, null, 2) + '\n');
  if (command === 'build') {
    await prepare(releases);
    await run(process.execPath, ['scripts/build.mjs']);
    await run(process.execPath, ['scripts/check-public.mjs', 'dist']);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
