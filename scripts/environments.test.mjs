import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { create } from 'tar';
import ts from 'typescript';
import { root, catalogue } from './context.mjs';
import { generateEnvironments, environments, environmentFiles, checkStarter } from './environments.mjs';

test('all SDK guides and downloadable consumers share executable sources and complete local imports', async () => {
  await mkdir(path.join(root, 'tmp'), { recursive: true });
  const work = await mkdtemp(path.join(root, 'tmp/environment-test-'));
  try {
    for (const sdk of await catalogue()) {
      const projectRoot = path.join(work, sdk.id);
      const docs = path.join(projectRoot, 'docs');
      await generateEnvironments({ id: sdk.id, sdk, docs, projectRoot });
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
          if (/\.(?:c?js)$/.test(name)) {
            const parsed = ts.createSourceFile(name, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
            assert.equal(parsed.parseDiagnostics.length, 0, `Invalid JavaScript: ${name}`);
            for (const [, target] of content.matchAll(/(?:from\s*|require\()['"]([^'"]+)['"]/g)) {
              if (!target.startsWith('.')) continue;
              const relative = path.posix.normalize(path.posix.join(path.posix.dirname(name), target));
              assert(files.has(relative) || files.has(`${relative}.js`), `Missing local import: ${name} -> ${target}`);
            }
          }
        }
        await checkStarter(path.join(docs, 'public/starters', `${environment}.tar.gz`), files);
      }
    }
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
