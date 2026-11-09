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
import { starterFiles } from './starters.mjs';
import siteConfig from '../shared/config.mjs';

function checkReadableCode(name, content, files) {
  const kind = /\.[cm]?ts$/.test(name) ? ts.ScriptKind.TS : ts.ScriptKind.JSX;
  const parsed = ts.createSourceFile(name, content, ts.ScriptTarget.Latest, true, kind);
  assert.equal(parsed.parseDiagnostics.length, 0, `Invalid program: ${name}`);
  function visit(node) {
    if (ts.isBlock(node) && node.statements.length) {
      const start = parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line;
      const end = parsed.getLineAndCharacterOfPosition(node.end).line;
      assert.notEqual(start, end, `Compressed statement block: ${name}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  assert(!/market\.client|market\.read|watchPrice\(|client\(sdk\)|import \* as sdk/.test(content), `Public adapter plumbing: ${name}`);
  for (const [, target] of content.matchAll(/(?:from\s*|require\()['"]([^'"]+)['"]/g)) {
    if (!target.startsWith('.')) continue;
    const relative = path.posix.normalize(path.posix.join(path.posix.dirname(name), target));
    assert(files.has(relative) || files.has(`${relative}.js`), `Missing local import: ${name} -> ${target}`);
  }
}

test('all walkthroughs match browsable programs, teach setup in order and retain legacy archives', async () => {
  await mkdir(path.join(root, 'tmp'), { recursive: true });
  const work = await mkdtemp(path.join(root, 'tmp/environment-test-'));
  try {
    const publicRoot = path.join(work, 'public');
    const manifest = { sdks: {}, releases: {} };
    const sdks = await catalogue();
    for (const sdk of sdks) {
      const { id, ...siteSdk } = sdk;
      const config = siteConfig({ sdk: siteSdk, siteUrl: `https://example.com/${id}/`, originUrl: 'https://example.com/', indexable: false, catalogue: sdks });
      const examplesLink = config.themeConfig.sidebar.find(group => group.text === 'Resources').items[0].link;
      assert.equal(examplesLink, `https://github.com/sieblyio/docs/tree/main/starters/${id}`);
      const projectRoot = path.join(work, sdk.id);
      const docs = path.join(projectRoot, 'docs');
      await generateEnvironments({ id: sdk.id, sdk, docs, projectRoot });
      await cp(path.join(docs, 'public/starters'), path.join(publicRoot, sdk.id, 'starters'), { recursive: true });
      manifest.sdks[sdk.id] = manifest.releases[sdk.id] = { version: '1.0.0' };
      for (const environment of environments) {
        const files = await environmentFiles(sdk.id, sdk, environment);
        const browsable = await starterFiles(sdk.id, sdk, environment);
        const guide = await readFile(path.join(docs, 'environments', `${environment}.md`), 'utf8');
        assert(!/@@[A-Z_]+@@/.test(guide));
        assert(!/tar -x|\.tar\.gz|Download the complete|copy (?:all|every) file/i.test(guide), 'Archive-first or copy-all guidance remains.');
        assert(guide.includes(`https://github.com/sieblyio/docs/tree/main/starters/${sdk.id}/${environment}`));
        assert.match(guide, /## Troubleshooting/);
        assert.match(guide, /\/compatibility/);
        assert.equal(JSON.parse(files.get('package.json')).dependencies[sdk.packageName], 'latest');
        const automaticPackage = ['node', 'typescript', 'bun'].includes(environment);
        for (const [name, content] of files) {
          assert.equal(browsable.get(name), content);
          if (!(name === 'package.json' && automaticPackage)) {
            assert(guide.includes(content.trimEnd()), `Walkthrough differs from source: ${sdk.id}/${environment}/${name}`);
          }
          if (/\.(?:[cm]?js|jsx|[cm]?ts)$/.test(name)) checkReadableCode(name, content, files);
        }
        if (environment === 'node') {
          assert(guide.indexOf('npm init -y') < guide.indexOf('npm install ' + sdk.packageName));
          assert(guide.indexOf('npm install ' + sdk.packageName) < guide.indexOf('```js [price.mjs]'));
          assert(guide.indexOf('node price.cjs') < guide.indexOf('## Stream a price'));
          assert.match(guide, /create `price.mjs` with `import`/);
          assert.match(guide, /```sh \[price.cjs\]\nnode price.cjs/);
        } else if (['react', 'vite', 'next', 'expo'].includes(environment)) {
          assert(guide.indexOf('```json [package.json]') < guide.indexOf('npm install\n'));
          const entry = environment === 'react' ? 'App.jsx' : environment === 'vite' ? 'main.js' : environment === 'next' ? 'app/layout.js' : 'App.js';
          assert(guide.indexOf('npm install\n') < guide.indexOf(`Create \`${entry}\``));
          if (environment === 'next') assert.equal((guide.match(/mkdir -p app\n/g) || []).length, 1);
        }
        await checkStarter(path.join(docs, 'public/starters', `${environment}.tar.gz`), files);
      }
    }
    await writeFile(path.join(publicRoot, 'build-manifest.json'), JSON.stringify(manifest));
    await writeFile(path.join(publicRoot, '.nojekyll'), '');
    await checkPublic(publicRoot);
    await cp(path.join(publicRoot, 'bybit/starters/node.tar.gz'), path.join(publicRoot, 'bybit/starters/unexpected.tar.gz'));
    await assert.rejects(checkPublic(publicRoot), /Unexpected public archive/);
    const navigation = await readFile(path.join(root, 'shared/content/getting-started/environments.md'), 'utf8');
    for (const environment of environments) assert(navigation.includes(`/environments/${environment}`));
    assert(!/downloadable|\.tar\.gz/.test(navigation));
  } finally {
    await rm(work, { recursive: true, force: true });
  }
});

test('legacy archive publication rejects extra, changed and missing files', async () => {
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

async function cancellationFixture(outcome) {
  const sdk = (await catalogue()).find(sdk => sdk.id === 'bybit');
  const source = (await environmentFiles(sdk.id, sdk, 'react')).get('App.jsx');
  const parsed = ts.createSourceFile('App.jsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  let setup;
  function find(node) {
    if (ts.isCallExpression(node) && node.expression.getText(parsed) === 'useEffect') setup = node.arguments[0].getText(parsed);
    ts.forEachChild(node, find);
  }
  find(parsed);
  assert(setup, 'No effect in the delivered component.');
  let closed = 0, subscriptions = 0, errors = 0, settle;
  const pending = new Promise((resolve, reject) => { settle = outcome === 'reject' ? reject : resolve; });
  const ws = new EventEmitter();
  ws.closeAll = () => { closed++; };
  ws.subscribeV5 = () => { subscriptions++; return [pending]; };
  const context = {
    RestClientV5: class { getTickers() { return new Promise(() => {}); } },
    WebsocketClient: class { constructor() { return ws; } },
    setRestPrice() {}, setLivePrice() {}, setError() { errors++; },
    setTimeout, clearTimeout,
  };
  const start = () => vm.runInNewContext(`(${setup})()`, context);
  return { start, settle, counts: () => ({ closed, subscriptions, errors }) };
}

test('the delivered effect skips a subscription after immediate cleanup', async () => {
  const fixture = await cancellationFixture('resolve');
  const stop = fixture.start();
  stop();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(fixture.counts(), { closed: 1, subscriptions: 0, errors: 0 });
});

for (const outcome of ['resolve', 'reject']) {
  test(`the delivered effect closes late setup when it ${outcome}s`, async () => {
    const fixture = await cancellationFixture(outcome);
    const stop = fixture.start();
    await new Promise(resolve => setImmediate(resolve));
    stop();
    assert.equal(fixture.counts().closed, 1);
    fixture.settle(outcome === 'reject' ? new Error('Stopped.') : undefined);
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(fixture.counts(), { closed: 2, subscriptions: 1, errors: 0 });
  });
}
