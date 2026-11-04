import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { create } from 'tar';
import ts from 'typescript';
import vm from 'node:vm';
import { EventEmitter } from 'node:events';
import { root, catalogue } from './context.mjs';
import { checkPublic } from './check-public.mjs';
import { generateEnvironments, environments, environmentFiles, checkStarter } from './environments.mjs';

test('all SDK guides and downloadable consumers share executable sources and complete local imports', async () => {
  await mkdir(path.join(root, 'tmp'), { recursive: true });
  const work = await mkdtemp(path.join(root, 'tmp/environment-test-'));
  try {
    const publicRoot = path.join(work, 'public');
    const manifest = { sdks: {}, releases: {} };
    for (const sdk of await catalogue()) {
      const projectRoot = path.join(work, sdk.id);
      const docs = path.join(projectRoot, 'docs');
      await generateEnvironments({ id: sdk.id, sdk, docs, projectRoot });
      await cp(path.join(docs, 'public/starters'), path.join(publicRoot, sdk.id, 'starters'), { recursive: true });
      manifest.sdks[sdk.id] = manifest.releases[sdk.id] = { version: '1.0.0' };
      for (const environment of environments) {
        const files = await environmentFiles(sdk.id, sdk, environment);
        const guide = await readFile(path.join(docs, 'environments', `${environment}.md`), 'utf8');
        assert(!/@@[A-Z_]+@@/.test(guide), 'Unresolved guide token');
        assert.match(guide, /## (Run|Run on iOS or Android)/);
        assert.match(guide, /## Troubleshooting/);
        assert.match(guide, /\/compatibility/);
        const pkg = JSON.parse(files.get('package.json'));
        assert.equal(pkg.dependencies[sdk.packageName], 'latest');
        for (const [name, content] of files) {
          assert(guide.includes(content.trimEnd()), `Guide and starter differ: ${sdk.id}/${environment}/${name}`);
          assert.equal(await readFile(path.join(projectRoot, 'examples/environments', environment, name), 'utf8'), content);
          if (/\.(?:c?js|jsx|ts)$/.test(name)) {
            const kind = name.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JSX;
            const parsed = ts.createSourceFile(name, content, ts.ScriptTarget.Latest, true, kind);
            assert.equal(parsed.parseDiagnostics.length, 0, `Invalid JavaScript: ${name}`);
            for (const [, target] of content.matchAll(/(?:from\s*|require\()['"]([^'"]+)['"]/g)) {
              if (!target.startsWith('.')) continue;
              const relative = path.posix.normalize(path.posix.join(path.posix.dirname(name), target));
              assert(files.has(relative) || files.has(`${relative}.js`) || files.has(relative.replace(/\.js$/, '.ts')), `Missing local import: ${name} -> ${target}`);
            }
          }
        }
        await checkStarter(path.join(docs, 'public/starters', `${environment}.tar.gz`), files);
      }
    }
    await writeFile(path.join(publicRoot, 'build-manifest.json'), JSON.stringify(manifest));
    await writeFile(path.join(publicRoot, '.nojekyll'), '');
    await checkPublic(publicRoot);
    await cp(path.join(publicRoot, 'bybit/starters/node.tar.gz'), path.join(publicRoot, 'bybit/starters/unexpected.tar.gz'));
    await assert.rejects(checkPublic(publicRoot), /Unexpected public archive/);
  } finally { await rm(work, { recursive: true, force: true }); }
});

test('starter publication rejects extra files, changed code and incomplete projects', async () => {
  const work = await mkdtemp(path.join(root, 'tmp/starter-guard-'));
  const archive = path.join(work, 'starter.tar.gz');
  const expected = new Map([['package.json', '{"private":true}\n'], ['prices.js', 'console.log("price");\n']]);
  try {
    for (const [name, content] of expected) await writeFile(path.join(work, name), content);
    await create({ file: archive, cwd: work, gzip: true }, [...expected.keys()]);
    await checkStarter(archive, expected);
    await writeFile(path.join(work, '.env'), 'SECRET=private\n');
    await create({ file: archive, cwd: work, gzip: true }, [...expected.keys(), '.env']);
    await assert.rejects(checkStarter(archive, expected), /Unexpected starter entry: .env/);
    await create({ file: archive, cwd: work, gzip: true }, ['package.json']);
    await assert.rejects(checkStarter(archive, expected), /missing required files/);
    await writeFile(path.join(work, 'prices.js'), 'console.log("changed");\n');
    await create({ file: archive, cwd: work, gzip: true }, [...expected.keys()]);
    await assert.rejects(checkStarter(archive, expected), /content differs/);
  } finally { await rm(work, { recursive: true, force: true }); }
});


test('cleanup before queued setup prevents a subscription from opening', async () => {
  const sdk = (await catalogue()).find(sdk => sdk.id === 'bybit');
  const files = await environmentFiles(sdk.id, sdk, 'node');
  let subscriptions = 0, closed = 0;
  const ws = new EventEmitter();
  ws.closeAll = () => { closed++; };
  const market = { stream: () => ws, event: 'update', subscribe: () => { subscriptions++; } };
  const context = { module: { exports: {} }, setTimeout, clearTimeout, require: name => name === './market.cjs' ? market : {} };
  vm.runInNewContext(files.get('price.cjs'), context);
  const fail = error => { throw error; };
  const stop = context.module.exports.watchPrice(() => {}, fail);
  stop();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(subscriptions, 0);
  assert.equal(closed, 1);
  assert.equal(ws.listenerCount('update'), 0);
  const stopActive = context.module.exports.watchPrice(() => {}, fail);
  try {
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(subscriptions, 1);
  } finally { stopActive(); }
});


for (const outcome of ['resolve', 'reject']) {
  test(`cleanup closes again when a pending subscription ${outcome}s`, async () => {
    const sdk = (await catalogue()).find(sdk => sdk.id === 'bybit');
    const files = await environmentFiles(sdk.id, sdk, 'node');
    let closed = 0, settle, errors = 0;
    const ws = new EventEmitter();
    ws.closeAll = () => { closed++; };
    const pending = new Promise((resolve, reject) => { settle = outcome === 'resolve' ? resolve : reject; });
    const market = { stream: () => ws, event: 'update', subscribe: () => pending };
    const context = { module: { exports: {} }, setTimeout, clearTimeout, require: name => name === './market.cjs' ? market : {} };
    vm.runInNewContext(files.get('price.cjs'), context);
    const stop = context.module.exports.watchPrice(() => {}, () => { errors++; });
    await new Promise(resolve => setImmediate(resolve));
    stop();
    assert.equal(closed, 1);
    settle(outcome === 'reject' ? new Error('Subscription stopped.') : undefined);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(closed, 2);
    assert.equal(errors, 0);
  });
}
