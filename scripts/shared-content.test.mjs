import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { root, catalogue } from './context.mjs';
import siteConfig from '../shared/config.mjs';
import ts from 'typescript';
import vm from 'node:vm';
import { copySharedContent, validateIncludes } from './shared-content.mjs';

test('shared includes resolve privately and fail on missing or circular dependencies', async () => {
  await mkdir(path.join(root, 'tmp'), { recursive: true });
  const work = await mkdtemp(path.join(root, 'tmp/shared-content-test-'));
  try {
    const docs = path.join(work, 'docs');
    await copySharedContent(root, docs);
    const fragment = '.vitepress/shared/getting-started/runtime-compatibility.md';
    assert.match(await readFile(path.join(docs, fragment), 'utf8'), /runtime compatibility/i);
    await writeFile(path.join(docs, 'index.md'), `<!--@include: @/${fragment}-->`);
    await validateIncludes(docs);

    await writeFile(path.join(docs, 'index.md'), '<!--@include: ./nested.md-->');
    await assert.rejects(validateIncludes(docs), /Invalid Markdown include "\.\/nested.md".*ENOENT/);
    await writeFile(path.join(docs, 'nested.md'), `<!--@include: @/${fragment}-->`);
    await validateIncludes(docs);

    await writeFile(path.join(docs, 'nested.md'), '<!--@include: ./missing.md-->');
    await assert.rejects(validateIncludes(docs), /Invalid Markdown include "\.\/missing.md".*ENOENT/);
    await writeFile(path.join(docs, 'nested.md'), '<!--@include: ./index.md-->');
    await assert.rejects(validateIncludes(docs), /Circular Markdown include/);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
});

test('task guides precede optional runtimes and setup pagers return to tasks', async () => {
  const entries = await catalogue();
  for (const sdk of entries) {
    const config = siteConfig({ sdk, catalogue: entries, siteUrl: `https://sieblyio.github.io/docs/${sdk.id}/`, originUrl: 'https://sieblyio.github.io/docs/', indexable: false });
    const groups = config.themeConfig.sidebar;
    assert.deepEqual(groups.map(group => group.text), ['Getting started', 'Guides', 'Using the SDK', 'Frameworks and runtimes', 'API reference', 'Resources']);
    const runtimes = groups.find(group => group.text === 'Frameworks and runtimes');
    assert.equal(runtimes.collapsed, true);
    for (const { link } of runtimes.items) {
      const page = { relativePath: `${link.slice(1)}.md`, frontmatter: {} };
      config.transformPageData(page);
      assert.deepEqual(page.frontmatter.prev, { text: 'Quickstart', link: '/getting-started' });
      assert.deepEqual(page.frontmatter.next, { text: 'Market data', link: '/guides/market-data' });
    }
    const report = { relativePath: 'compatibility.md', frontmatter: {} };
    config.transformPageData(report);
    assert.equal(report.frontmatter.prev, false);
    assert.equal(report.frontmatter.next, false);
    const troubleshooting = { relativePath: 'guides/troubleshooting.md', frontmatter: {} };
    config.transformPageData(troubleshooting);
    assert.equal(troubleshooting.frontmatter.next.link, '/reference');
    const reference = { relativePath: 'reference.md', frontmatter: {} };
    config.transformPageData(reference);
    assert.equal(reference.frontmatter.prev.link, '/guides/troubleshooting');
    const quickstart = await readFile(path.join(root, 'sdks', sdk.id, 'docs/getting-started.md'), 'utf8');
    const introduction = await readFile(path.join(root, 'sdks', sdk.id, 'docs/index.md'), 'utf8');
    assert.match(quickstart, /getting-started\/other-setups\.md/);
    assert.doesNotMatch(quickstart, /getting-started\/environments\.md/);
    assert.match(introduction, /getting-started\/environments\.md/);
    assert.match(introduction, /\{#usage\}/);
  }
});

async function accountExample(id, { env = true, failure = false, response } = {}) {
  const source = await readFile(path.join(root, 'sdks', id, 'examples/account-state.ts'), 'utf8');
  const calls = [];
  class Client {
    constructor(options) { calls.push(['constructor', options]); }
    async getWalletBalance(params) {
      calls.push(['getWalletBalance', params]);
      if (failure) throw { request: { secret: 'do-not-log-this' } };
      return response ?? { retCode: 0, result: { list: [{ coin: [] }] } };
    }
    async getAccountInformation() {
      calls.push(['getAccountInformation']);
      if (failure) throw { request: { secret: 'do-not-log-this' } };
      return response ?? { balances: [] };
    }
  }
  const logs = [];
  const sandbox = {
    exports: {},
    process: { env: env ? { BYBIT_API_KEY: 'test-key', BYBIT_API_SECRET: 'test-secret', BINANCE_API_KEY: 'test-key', BINANCE_API_SECRET: 'test-secret' } : {} },
    console: { log: (...args) => logs.push(args), error: (...args) => logs.push(args) },
    require(name) {
      assert.equal(name, id === 'bybit' ? 'bybit-api' : 'binance');
      return { RestClientV5: Client, MainClient: Client };
    },
  };
  const code = ts.transpileModule(source.replace('main().catch', 'globalThis.done = main().catch'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, sandbox);
  await sandbox.done;
  return { calls, logs, exitCode: sandbox.process.exitCode };
}

test('account examples use Testnet read-only requests and do not log request errors', async () => {
  for (const id of ['bybit', 'binance']) {
    const success = await accountExample(id);
    assert.equal(success.calls[0][1].testnet, true);
    assert.equal(success.calls[1][0], id === 'bybit' ? 'getWalletBalance' : 'getAccountInformation');
    if (id === 'bybit') assert.equal(success.calls[1][1].accountType, 'UNIFIED');
    assert.equal(success.calls.length, 2);
    assert.equal(success.logs[0][0], 'Account access verified.');
    assert.equal(success.logs[1][1], 0);
    assert.equal(success.exitCode, undefined);
    for (const scenario of [{ env: false }, { failure: true }]) {
      const failed = await accountExample(id, scenario);
      assert.equal(failed.exitCode, 1);
      assert.doesNotMatch(JSON.stringify(failed.logs), /do-not-log-this|test-secret|Account access verified/);
      if (scenario.env === false) assert.equal(failed.calls.length, 0);
    }
    const guide = await readFile(path.join(root, 'sdks', id, 'docs/guides/authentication.md'), 'utf8');
    assert.match(guide, /node --env-file=\.env account\.mjs/);
    assert.match(guide, /account-state\.ts\{js\}/);
    assert.match(guide, /add `\.env` to `\.gitignore`/);
  }
  for (const response of [{ retCode: 10003, retMsg: 'Key is invalid' }, { retCode: 0, result: { list: [] } }]) {
    const failed = await accountExample('bybit', { response });
    assert.equal(failed.exitCode, 1);
    assert.doesNotMatch(JSON.stringify(failed.logs), /Account access verified/);
  }
});
