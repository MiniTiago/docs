import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { create } from 'tar';
import ts from 'typescript';
import { root, catalogue } from './context.mjs';
import { checkPublic } from './check-public.mjs';
import { generateEnvironments, environments, environmentFiles, checkStarter } from './environments.mjs';

function checkProgram(name, content, files) {
  const kind = /\.[cm]?ts$/.test(name) ? ts.ScriptKind.TS : ts.ScriptKind.JSX;
  const parsed = ts.createSourceFile(name, content, ts.ScriptTarget.Latest, true, kind);
  assert.equal(parsed.parseDiagnostics.length, 0, `Invalid program: ${name}`);
  for (const [, target] of content.matchAll(/(?:from\s*|require\()['"]([^'"]+)['"]/g)) {
    if (!target.startsWith('.')) continue;
    const relative = path.posix.normalize(path.posix.join(path.posix.dirname(name), target));
    assert(files.has(relative) || files.has(`${relative}.js`), `Missing local import: ${name} -> ${target}`);
  }
}

test('generated guides match the starter programs and publish valid archives', async () => {
  await mkdir(path.join(root, 'tmp'), { recursive: true });
  const work = await mkdtemp(path.join(root, 'tmp/environment-test-'));
  try {
    const publicRoot = path.join(work, 'public');
    const manifest = { sdks: {}, releases: {} };
    const sdks = await catalogue();
    for (const sdk of sdks) {
      const projectRoot = path.join(work, sdk.id);
      const docs = path.join(projectRoot, 'docs');
      await generateEnvironments({ id: sdk.id, sdk, docs, projectRoot });
      await cp(path.join(docs, 'public/starters'), path.join(publicRoot, sdk.id, 'starters'), { recursive: true });
      manifest.sdks[sdk.id] = manifest.releases[sdk.id] = { version: '1.0.0' };
      for (const environment of environments) {
        const files = await environmentFiles(sdk.id, sdk, environment);
        const guide = await readFile(path.join(docs, 'environments', `${environment}.md`), 'utf8');
        assert(!/@@[A-Z_]+@@/.test(guide));
        assert(guide.includes(`https://github.com/sieblyio/docs/tree/main/starters/${sdk.id}/${environment}`));
        const automaticPackage = ['node', 'typescript', 'bun'].includes(environment);
        for (const [name, content] of files) {
          if (!(name === 'package.json' && automaticPackage)) {
            assert(guide.includes(content.trimEnd()), `Walkthrough differs from source: ${sdk.id}/${environment}/${name}`);
          }
          if (/\.(?:[cm]?js|jsx|[cm]?ts)$/.test(name)) checkProgram(name, content, files);
        }
      }
    }
    await writeFile(path.join(publicRoot, 'build-manifest.json'), JSON.stringify(manifest));
    await writeFile(path.join(publicRoot, '.nojekyll'), '');
    await checkPublic(publicRoot);
    await cp(path.join(publicRoot, 'bybit/starters/node.tar.gz'), path.join(publicRoot, 'bybit/starters/unexpected.tar.gz'));
    await assert.rejects(checkPublic(publicRoot), /Unexpected public archive/);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
});

test('starter archives reject extra, changed and missing files', async () => {
  await mkdir(path.join(root, 'tmp'), { recursive: true });
  const work = await mkdtemp(path.join(root, 'tmp/starter-guard-'));
  const archive = path.join(work, 'starter.tar.gz');
  const expected = new Map([['package.json', '{"private":true}\n'], ['price.mjs', 'console.log("price");\n']]);
  try {
    for (const [name, content] of expected) await writeFile(path.join(work, name), content);
    await create({ file: archive, cwd: work, gzip: true }, [...expected.keys()]);
    await checkStarter(archive, expected);
    await writeFile(path.join(work, '.env'), 'SECRET=private\n');
    await create({ file: archive, cwd: work, gzip: true }, [...expected.keys(), '.env']);
    await assert.rejects(checkStarter(archive, expected), /Unexpected starter entry: .env/);
    await create({ file: archive, cwd: work, gzip: true }, ['package.json']);
    await assert.rejects(checkStarter(archive, expected), /missing required files/);
    await writeFile(path.join(work, 'price.mjs'), 'console.log("changed");\n');
    await create({ file: archive, cwd: work, gzip: true }, [...expected.keys()]);
    await assert.rejects(checkStarter(archive, expected), /content differs/);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
});
