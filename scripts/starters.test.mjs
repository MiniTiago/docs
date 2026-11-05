import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from './context.mjs';
import { generateStarters, checkStarters } from './starters.mjs';

async function fixture(run) {
  await mkdir(path.join(root, 'tmp'), { recursive: true });
  const directory = await mkdtemp(path.join(root, 'tmp/starter-folders-'));
  try {
    await generateStarters(directory);
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('checked-in examples are deterministic and checking never writes', async () => {
  await fixture(async directory => {
    const file = path.join(directory, 'bybit/node/price.cjs');
    const before = await stat(file);
    const bytes = await readFile(file);
    assert.equal((await checkStarters(directory)).projects, 24);
    assert.deepEqual(await readFile(file), bytes);
    assert.equal((await stat(file)).mtimeMs, before.mtimeMs);
    await generateStarters(directory);
    assert.deepEqual(await readFile(file), bytes);
    const readme = await readFile(path.join(directory, 'bybit/node/README.md'), 'utf8');
    assert.match(readme, /npm install\nnpm start/);
    assert.match(readme, /bybit\/environments\/node.html/);
    assert(!readme.includes(process.env.GITHUB_SHA || 'GITHUB_SHA'));
  });
});

test('local installs, lockfiles and build output are preserved and ignored', async () => {
  await fixture(async directory => {
    const project = path.join(directory, 'bybit/react');
    for (const name of ['node_modules', 'dist', '.next', '.expo']) {
      await mkdir(path.join(project, name));
      await writeFile(path.join(project, name, 'local-output.js'), 'local data');
    }
    await writeFile(path.join(project, 'package-lock.json'), 'local lock');
    await writeFile(path.join(project, '.env.local'), 'LOCAL_SETTING=value');
    await checkStarters(directory);
    await generateStarters(directory);
    assert.equal(await readFile(path.join(project, 'dist/local-output.js'), 'utf8'), 'local data');
    assert.equal(await readFile(path.join(project, 'package-lock.json'), 'utf8'), 'local lock');
  });
});

test('drift checks reject changed, missing and unexpected files and stale directories', async () => {
  await fixture(async directory => {
    const file = path.join(directory, 'bybit/node/price.cjs');
    const original = await readFile(file);
    await writeFile(file, 'changed program');
    await assert.rejects(checkStarters(directory), /Changed generated file: bybit\/node\/price.cjs/);
    await writeFile(file, original);
    await rm(file);
    await assert.rejects(checkStarters(directory), /Missing generated file: bybit\/node\/price.cjs/);
    await writeFile(file, original);
    const extra = path.join(directory, 'bybit/node/extra.js');
    await writeFile(extra, 'unexpected source');
    await assert.rejects(checkStarters(directory), /Unexpected example path: bybit\/node\/extra.js/);
    await generateStarters(directory);
    assert.equal(await readFile(extra, 'utf8'), 'unexpected source');
    await rm(extra);
    await mkdir(path.join(directory, 'bybit/old-setup'));
    await assert.rejects(checkStarters(directory), /Unexpected example path: bybit\/old-setup/);
    await rm(path.join(directory, 'bybit/old-setup'), { recursive: true });
    await mkdir(path.join(directory, 'old-sdk'));
    await assert.rejects(checkStarters(directory), /Unexpected example path: old-sdk/);
  });
});
