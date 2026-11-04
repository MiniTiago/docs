import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, writeFile, rm, rename } from 'node:fs/promises';
import path from 'node:path';
import { root, ids, context } from './context.mjs';
import { assemblePortal } from './portal.mjs';
import { checkSite } from './check-site.mjs';

const args = process.argv.slice(2);
let selected;
for (let i = 0; i < args.length; i += 2) {
  if (!['--sdk', '--source', '--version'].includes(args[i]) || !args[i + 1]) throw new Error('Usage: npm run build -- [--sdk ID] [--source PATH] [--version VERSION]');
  if (args[i] === '--sdk') selected = args[i + 1];
  if (args[i] === '--source') process.env.SDK_ROOT = path.resolve(args[i + 1]);
  if (args[i] === '--version') process.env.SDK_VERSION = args[i + 1];
}
if (!selected && (process.env.SDK_ROOT || process.env.SDK_VERSION)) throw new Error('A source or version override requires --sdk.');
const targets = selected ? [selected] : ids;
const first = await context(targets[0]);
await mkdir(path.join(root, '.work'), { recursive: true });
const lock = path.join(root, '.work/build.lock');
try { await mkdir(lock); } catch (error) {
  if (error.code === 'EEXIST') throw new Error('Another build owns .work/build.lock. Wait for it to finish.');
  throw error;
}
const dist = path.join(root, 'dist');
const next = path.join(root, 'dist.next');
const previous = path.join(root, 'dist.previous');
function run(cmd, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, cmd, { cwd: root, env: { ...process.env, ...env }, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${cmd.join(' ')} failed (${code})`)));
  });
}
try {
  await rm(next, { recursive: true, force: true });
  const documentationRevision = process.env.GITHUB_SHA;
  if (documentationRevision && !/^[a-f0-9]{40}$/.test(documentationRevision)) throw new Error('GITHUB_SHA must be an exact documentation source revision.');
  let manifest = { siteUrl: first.origin.href, indexable: first.indexable, sdks: {}, releases: {}, ...(documentationRevision ? { documentationRevision } : {}) };
  if (selected) {
    try { manifest = JSON.parse(await readFile(path.join(dist, 'build-manifest.json'), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') throw new Error('Run npm run build once before an individual SDK build.'); throw error; }
    if (manifest.siteUrl !== first.origin.href || manifest.indexable !== first.indexable) throw new Error('Site URL or indexing mode changed. Run a full build.');
  }
  for (const id of targets) {
    const ctx = await context(id);
    console.log(`\nBuilding ${ctx.sdk.name} ${ctx.pkg.version} at ${ctx.site.pathname}`);
    await run(['scripts/generate.mjs'], { SDK_ID: id });
    await run(['scripts/check-examples.mjs'], { SDK_ID: id });
    await run(['node_modules/vitepress/bin/vitepress.js', 'build', ctx.docs], { SDK_ID: id });
    const metadata = JSON.parse(await readFile(path.join(ctx.docs, '.vitepress/generated.json'), 'utf8'));
    manifest.sdks[id] = { ...metadata, id, path: ctx.site.pathname };
    if (ctx.release) {
      const { sourcePath, ...release } = ctx.release;
      manifest.releases ??= {};
      manifest.releases[id] = release;
    } else if (manifest.releases) delete manifest.releases[id];
  }
  if (selected) await cp(dist, next, { recursive: true,
    filter: (source) => !targets.includes(path.relative(dist, source).split(path.sep)[0]),
  });
  else await mkdir(next, { recursive: true });
  for (const id of targets) {
    await rm(path.join(next, id), { recursive: true, force: true });
    await rename(path.join(root, '.work', id, 'docs/.vitepress/dist'), path.join(next, id));
  }
  await assemblePortal(next, manifest);
  await writeFile(path.join(next, 'build-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const checks = await checkSite(next);
  await mkdir(path.join(root, 'verification'), { recursive: true });
  await writeFile(path.join(root, 'verification/build-result.json'), JSON.stringify(checks, null, 2) + '\n');
  // Keep the last complete output until the entire candidate has passed validation.
  await rm(previous, { recursive: true, force: true });
  let backedUp = false;
  try { await rename(dist, previous); backedUp = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  try { await rename(next, dist); } catch (error) { if (backedUp) await rename(previous, dist); throw error; }
  await rm(previous, { recursive: true, force: true });
  console.log(`Ready: ${targets.join(', ')}. Combined static site: dist/`);
} finally {
  await rm(lock, { recursive: true, force: true });
}
