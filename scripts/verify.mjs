import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, writeFile, readdir, symlink, stat, appendFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { root, context, ids } from './context.mjs';
import { checkSite } from './check-site.mjs';

const verification = path.join(root, 'verification');
await mkdir(verification, { recursive: true });
const runDir = await mkdtemp(path.join(verification, 'run-'));
const dist = path.join(root, 'dist');
async function snapshot(directory) {
  const result = new Map();
  for (const file of (await readdir(directory, { recursive: true })).sort()) {
    if ((await stat(path.join(directory, file))).isFile()) result.set(file, await readFile(path.join(directory, file)));
  }
  return result;
}
async function same(directory, expected) {
  const actual = await snapshot(directory);
  assert.deepEqual([...actual.keys()], [...expected.keys()], 'File names changed unexpectedly');
  for (const [name, bytes] of actual) assert(bytes.equals(expected.get(name)), `Unexpected change: ${name}`);
}
let sequence = 0;
async function build(args = [], env = {}, succeeds = true) {
  const log = path.join(runDir, `${++sequence}-build.log`);
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/build.mjs', ...args], { cwd: root, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = [];
    child.stdout.on('data', (data) => chunks.push(data));
    child.stderr.on('data', (data) => chunks.push(data));
    child.on('error', reject);
    child.on('exit', async (status) => { await writeFile(log, Buffer.concat(chunks)); resolve(status); });
  });
  assert.equal(code === 0, succeeds, `Unexpected build outcome. Read ${log}`);
}
await checkSite(dist);
const ctx = await context('hyperliquid');
assert.equal(ctx.indexable, false, 'Run verification from the default local preview configuration.');
const before = await snapshot(dist);
const otherSites = new Map(ids.filter(id => id !== ctx.id).map((id) => [id, new Map([...before].filter(([name]) => name.startsWith(`${id}/`)).map(([name, value]) => [name.slice(id.length + 1), value]))]));
const source = path.join(runDir, 'source-fixture');
await mkdir(source);
await cp(path.join(ctx.sdkRoot, 'src'), path.join(source, 'src'), { recursive: true });
for (const file of await readdir(ctx.sdkRoot)) if (file === 'package.json' || /^tsconfig.*\.json$/.test(file)) await cp(path.join(ctx.sdkRoot, file), path.join(source, file));
await symlink(path.join(ctx.sdkRoot, 'node_modules'), path.join(source, 'node_modules'), 'dir');
const originalSource = await snapshot(path.join(ctx.sdkRoot, 'src'));
const originalPackage = await readFile(path.join(ctx.sdkRoot, 'package.json'));
const fixturePackage = JSON.parse(originalPackage);
fixturePackage.version = '1.0.1-docs-probe';
fixturePackage.engines = { ...fixturePackage.engines, node: '>=99.0.0' };
await writeFile(path.join(source, 'package.json'), JSON.stringify(fixturePackage));
await appendFile(path.join(source, 'src/index.ts'), '\n/** Local documentation synchronisation probe. */\nexport function documentationSyncProbe(params: { symbol: string }): string { return params.symbol; }\n');
const result = {};
try {
  console.log('Checking a simulated release in an isolated source fixture...');
  await build(['--sdk', 'hyperliquid', '--source', source, '--version', fixturePackage.version]);
  const reference = await readFile(path.join(dist, 'hyperliquid/api/functions/documentationSyncProbe.html'), 'utf8');
  assert(reference.includes('Local documentation synchronisation probe.'));
  assert(reference.includes('symbol'));
  assert((await readFile(path.join(dist, 'hyperliquid/index.html'), 'utf8')).includes('1.0.1-docs-probe'));
  assert((await readFile(path.join(dist, 'hyperliquid/getting-started.html'), 'utf8')).includes('&gt;=99.0.0'));
  for (const [id, expected] of otherSites) await same(path.join(dist, id), expected);
  result.releaseUpdatesReferenceVersionAndRequirements = true;
  result.otherSdkFilesUnchanged = true;

  console.log('Checking version mismatch rejection and previous-output preservation...');
  const accepted = await snapshot(dist);
  await build(['--sdk', 'hyperliquid', '--source', source, '--version', '0.0.0-wrong'], {}, false);
  await same(dist, accepted);
  result.versionMismatchPreservesOutput = true;

  console.log('Checking broken-link rejection...');
  const index = path.join(dist, 'hyperliquid/index.html');
  const html = await readFile(index);
  try {
    await appendFile(index, '<a href="/hyperliquid/does-not-exist.html">Broken link probe</a>');
    await assert.rejects(checkSite(dist), /missing file/);
  } finally { await writeFile(index, html); }
  result.brokenLinksRejected = true;
} finally {
  await build(['--sdk', 'hyperliquid']);
}
await same(path.join(ctx.sdkRoot, 'src'), originalSource);
assert((await readFile(path.join(ctx.sdkRoot, 'package.json'))).equals(originalPackage));
await assert.rejects(stat(path.join(dist, 'hyperliquid/api/functions/documentationSyncProbe.html')), { code: 'ENOENT' });
result.originalSdkUnchanged = true;
result.removedExportDisappears = true;

console.log('Checking indexable output under a GitHub Pages project prefix...');
try {
  await build([], { DOCS_SITE_URL: 'https://sieblyio.github.io/sdk-docs-local-check/', DOCS_INDEXABLE: '1' });
  const checks = await checkSite(dist);
  assert(checks.indexable && checks.sdkCount === 3);
  result.githubPagesPrefixAndSeo = true;
} finally {
  await build([], { DOCS_SITE_URL: 'http://localhost:4173/', DOCS_INDEXABLE: '0' });
}
result.finalLocalPreview = await checkSite(dist);
await writeFile(path.join(verification, 'shared-result.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
