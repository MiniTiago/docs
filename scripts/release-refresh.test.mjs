import test from 'node:test';
import assert from 'node:assert/strict';
import { refreshReleases, updatedManifest, validateRefreshBranch } from './release-refresh.mjs';
import { requireMainDispatch, repository, refreshBranch } from './github-automation.mjs';

const base = 'a'.repeat(40), proposal = 'b'.repeat(40), newer = 'c'.repeat(40);
const manifest = (hl = '1.0.1') => ({ name: 'siebly-sdk-release-inputs', private: true, dependencies: { '@siebly/hyperliquid-api': hl, 'bybit-api': '4.8.4', binance: '3.6.11' } });
const pr = (head = proposal) => ({ number: 7, html_url: `https://github.com/${repository}/pull/7`, user: { login: 'github-actions[bot]', type: 'Bot' }, head: { sha: head, ref: refreshBranch, repo: { full_name: repository } }, base: { ref: 'main', repo: { full_name: repository } } });
const comparison = () => ({ merge_base_commit: { sha: base }, total_commits: 1, files: [{ filename: 'releases/package.json', status: 'modified' }], commits: [{ author: { login: 'github-actions[bot]' } }] });

// GitHub automation state only. These tests never run SDK or exchange consumers.
function fixture({ initialHead, existingPr, failDispatch = false, previousMain = base, concurrentEdit = false } = {}) {
  let head = initialHead, open = existingPr, dispatchFailed = false;
  const refs = new Map(initialHead ? [[refreshBranch, initialHead]] : []);
  const contents = new Map([[base, manifest()], [proposal, manifest('1.0.2')]]);
  const calls = [];
  async function api(endpoint, method = 'GET', body) {
    calls.push({ endpoint, method, body });
    if (endpoint === '') return { node_id: 'repository-id' };
    if (endpoint === '/git/ref/heads/main') return { object: { sha: base } };
    if (endpoint.startsWith('/git/ref/heads/')) {
      const value = refs.get(endpoint.slice('/git/ref/heads/'.length));
      if (!value) throw Object.assign(new Error('Absent ref'), { status: 404 });
      return { object: { sha: value } };
    }
    if (endpoint.startsWith('/contents/')) {
      const revision = endpoint.split('ref=')[1];
      return { type: 'file', encoding: 'base64', size: 250, content: Buffer.from(JSON.stringify(contents.get(revision))).toString('base64') };
    }
    if (endpoint.startsWith('/compare/')) return { ...comparison(), merge_base_commit: { sha: previousMain } };
    if (endpoint.startsWith('/pulls?')) return open ? [{ ...open, head: { ...open.head, sha: head } }] : [];
    if (endpoint === `/git/commits/${base}`) return { tree: { sha: 'base-tree' } };
    if (endpoint === '/git/trees') {
      assert.equal(body.base_tree, 'base-tree');
      assert.equal(body.tree.length, 1);
      assert.equal(body.tree[0].path, 'releases/package.json');
      contents.set(newer, JSON.parse(body.tree[0].content));
      return { sha: 'new-tree' };
    }
    if (endpoint === '/git/commits') { assert.deepEqual(body.parents, [base]); return { sha: newer }; }
    if (endpoint === '/graphql') {
      const input = body.variables.input;
      if (concurrentEdit) refs.set(refreshBranch, 'e'.repeat(40));
      for (const update of input.refUpdates) assert.equal(refs.get(update.name.replace('refs/heads/', '')) || '0'.repeat(40), update.beforeOid, 'Expected head must match before mutation');
      for (const update of input.refUpdates) refs.set(update.name.replace('refs/heads/', ''), update.afterOid);
      head = refs.get(refreshBranch);
      return { data: { updateRefs: {} } };
    }
    if (endpoint === '/pulls' && method === 'POST') { open = pr(head); return open; }
    if (endpoint === '/actions/workflows/publish.yml/dispatches') {
      assert.deepEqual(body, { ref: refreshBranch });
      if (failDispatch && !dispatchFailed) { dispatchFailed = true; throw new Error('Dispatch failed'); }
      return { workflow_run_id: 42 };
    }
    throw new Error(`Unexpected request ${endpoint}`);
  }
  return { api, calls, refs };
}

test('latest selection changes only exact increasing SDK versions and handles no change', () => {
  assert.equal(updatedManifest(manifest(), manifest().dependencies), undefined);
  assert.deepEqual(updatedManifest(manifest(), manifest('1.0.2').dependencies), manifest('1.0.2'));
  for (const version of ['latest', '^1.0.2', '1.0.2-beta.1', '1.0.0']) assert.throws(() => updatedManifest(manifest(), manifest(version).dependencies));
});

test('non-main, foreign and non-dispatch refresh contexts cannot write', () => {
  const env = { GITHUB_REPOSITORY: repository, GITHUB_REF: 'refs/heads/main', GITHUB_EVENT_NAME: 'workflow_dispatch' };
  requireMainDispatch(env);
  for (const changes of [{ GITHUB_REF: `refs/heads/${refreshBranch}` }, { GITHUB_REPOSITORY: 'someone/docs' }, { GITHUB_EVENT_NAME: 'pull_request' }]) assert.throws(() => requireMainDispatch({ ...env, ...changes }));
});

test('foreign PRs, human commits, extra files and pending downgrades are preserved', () => {
  const input = () => ({ comparison: comparison(), prs: [pr()], head: proposal, branchManifest: manifest('1.0.2'), desired: manifest('1.0.3') });
  for (const change of [
    (v) => { v.prs[0].user.login = 'someone'; },
    (v) => { v.prs[0].head.repo.full_name = 'someone/docs'; },
    (v) => { v.comparison.files.push({ filename: 'README.md', status: 'modified' }); },
    (v) => { v.comparison.commits[0].author.login = 'someone'; },
    (v) => { v.desired = manifest(); },
  ]) { const value = input(); change(value); assert.throws(() => validateRefreshBranch(value)); }
});

test('no change creates no branch, PR or build', async () => {
  const f = fixture();
  assert.deepEqual(await refreshReleases(f.api, manifest().dependencies), { changed: false });
  assert.equal(f.calls.some((c) => c.method !== 'GET'), false);
});

test('creates one manifest-only bot PR and explicitly dispatches its branch build', async () => {
  const f = fixture();
  const result = await refreshReleases(f.api, manifest('1.0.2').dependencies);
  assert.equal(result.changed, true);
  assert.equal(result.pr, pr().html_url);
  assert.match(result.build, /actions\/runs\/42$/);
  assert.equal(f.calls.filter((c) => c.endpoint === '/pulls' && c.method === 'POST').length, 1);
  assert.deepEqual([...f.refs.keys()], [refreshBranch]);
  const swap = f.calls.filter((c) => c.body?.variables?.input?.refUpdates?.some((u) => u.name === `refs/heads/${refreshBranch}`))[0];
  assert.equal(swap.body.variables.input.refUpdates.length, 1);
  assert.equal(swap.body.variables.input.refUpdates[0].beforeOid, '0'.repeat(40));
});

test('rerun after PR creation and dispatch failure reuses the PR/head without new writes', async () => {
  const f = fixture({ failDispatch: true });
  await assert.rejects(refreshReleases(f.api, manifest('1.0.2').dependencies), /Dispatch failed/);
  const writes = f.calls.filter((c) => c.endpoint === '/graphql' || c.endpoint === '/pulls').length;
  const result = await refreshReleases(f.api, manifest('1.0.2').dependencies);
  assert.equal(result.head, newer);
  assert.equal(f.calls.filter((c) => c.endpoint === '/graphql' || c.endpoint === '/pulls').length, writes);
  assert.equal(f.calls.filter((c) => c.endpoint.endsWith('/dispatches')).length, 2);
});

test('a concurrent edit fails the expected-head swap and preserves the edited branch', async () => {
  const f = fixture({ initialHead: proposal, previousMain: 'd'.repeat(40), concurrentEdit: true });
  await assert.rejects(refreshReleases(f.api, manifest('1.0.3').dependencies), /Expected head must match/);
  assert.equal(f.refs.get(refreshBranch), 'e'.repeat(40));
  assert.equal(f.calls.some((c) => c.endpoint === '/pulls' || c.endpoint.endsWith('/dispatches')), false);
});

test('a persistent branch from a previous merged PR starts a clean main-based proposal', async () => {
  const f = fixture({ initialHead: proposal, previousMain: 'd'.repeat(40) });
  const result = await refreshReleases(f.api, manifest('1.0.3').dependencies);
  assert.equal(result.head, newer);
  const commit = f.calls.find((c) => c.endpoint === '/git/commits');
  assert.deepEqual(commit.body.parents, [base]);
  assert.equal(f.calls.filter((c) => c.endpoint === '/pulls').length, 1);
});
