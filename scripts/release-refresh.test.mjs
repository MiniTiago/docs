import test from 'node:test';
import assert from 'node:assert/strict';
import { refreshReleases, updatedManifest, validateRefreshBranch, approveAndMergeRefresh } from './release-refresh.mjs';
import { requireMainDispatch, repository, refreshBranch, createGitHubApi } from './github-automation.mjs';

const base = 'a'.repeat(40), proposal = 'b'.repeat(40), newer = 'c'.repeat(40);
const manifest = (hl = '1.0.1') => ({ name: 'siebly-sdk-release-inputs', private: true, dependencies: { '@siebly/hyperliquid-api': hl, 'bybit-api': '4.8.4', binance: '3.6.11' } });
const pr = (head = proposal) => ({ state: 'open', number: 7, html_url: `https://github.com/${repository}/pull/7`, user: { login: 'github-actions[bot]', type: 'Bot' }, head: { sha: head, ref: refreshBranch, repo: { full_name: repository } }, base: { ref: 'main', repo: { full_name: repository } } });
const comparison = () => ({ merge_base_commit: { sha: base }, total_commits: 1, files: [{ filename: 'releases/package.json', status: 'modified' }], commits: [{ author: { login: 'github-actions[bot]' } }] });

// GitHub automation state only. These tests never run SDK or exchange consumers.
function fixture({ initialHead, existingPr, previousMain = base, concurrentEdit = false, stalePrReads = 0 } = {}) {
  let head = initialHead, open = existingPr;
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
    if (endpoint.startsWith('/pulls?') || endpoint === '/pulls/7') {
      const reportedHead = head === newer && stalePrReads-- > 0 ? initialHead : head;
      const value = open ? { ...open, head: { ...open.head, sha: reportedHead } } : undefined;
      return endpoint === '/pulls/7' ? value : value ? [value] : [];
    }
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

test('creates one manifest-only bot PR for real pull-request validation', async () => {
  const f = fixture();
  const result = await refreshReleases(f.api, manifest('1.0.2').dependencies);
  assert.equal(result.changed, true);
  assert.equal(result.pr, pr().html_url);
  assert.equal(result.number, 7);
  assert.equal(f.calls.filter((c) => c.endpoint === '/pulls' && c.method === 'POST').length, 1);
  assert.deepEqual([...f.refs.keys()], [refreshBranch]);
  const swap = f.calls.filter((c) => c.body?.variables?.input?.refUpdates?.some((u) => u.name === `refs/heads/${refreshBranch}`))[0];
  assert.equal(swap.body.variables.input.refUpdates.length, 1);
  assert.equal(swap.body.variables.input.refUpdates[0].beforeOid, '0'.repeat(40));
});

test('rerun after PR creation reuses the PR/head without new writes', async () => {
  const f = fixture();
  await refreshReleases(f.api, manifest('1.0.2').dependencies);
  const writes = f.calls.filter((c) => c.endpoint === '/graphql' || c.endpoint === '/pulls').length;
  const result = await refreshReleases(f.api, manifest('1.0.2').dependencies);
  assert.equal(result.head, newer);
  assert.equal(f.calls.filter((c) => c.endpoint === '/graphql' || c.endpoint === '/pulls').length, writes);
  assert.equal(f.calls.some((c) => c.endpoint.endsWith('/dispatches')), false);
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

function approvalFixture({ status = 'action_required', deny, change } = {}) {
  const value = {
    run: { id: 42, event: 'pull_request', status: 'completed', conclusion: status, path: '.github/workflows/publish.yml', actor: { login: 'github-actions[bot]' }, repository: { full_name: repository }, head_repository: { full_name: repository }, head_sha: proposal, head_branch: refreshBranch, html_url: `https://github.com/${repository}/actions/runs/42` },
    pr: { ...pr(), state: 'open', changed_files: 1 },
    jobs: [], files: [{ filename: 'releases/package.json', status: 'modified' }],
    mainSha: base, mergeBaseSha: base, before: manifest(), after: manifest('1.0.2'),
  };
  if (change) change(value);
  let approvals = 0, merges = 0, clock = 0;
  const api = async (endpoint, method = 'GET') => {
    if (endpoint.includes('/runs?')) return { workflow_runs: [value.run] };
    assert.equal(endpoint, '/actions/runs/42/approve');
    assert.equal(method, 'POST');
    approvals++;
    if (deny) throw Object.assign(new Error('Forbidden'), { status: deny });
    value.run.status = 'in_progress'; value.run.conclusion = null;
  };
  const options = {
    inspect: async () => structuredClone(value),
    merge: async () => { merges++; return 'Merged protected PR'; },
    now: () => clock,
    sleep: async (ms) => { clock += ms; if (approvals) { value.run.status = 'completed'; value.run.conclusion = 'success'; } },
  };
  return { api, options, proposal: { number: 7, head: proposal, pr: pr().html_url }, counts: () => ({ approvals, merges, clock }) };
}

test('approves only the validated held PR run, waits once, then invokes the shared merger', async () => {
  const f = approvalFixture();
  assert.equal(await approveAndMergeRefresh(f.api, f.proposal, f.options), 'Merged protected PR');
  assert.deepEqual(f.counts(), { approvals: 1, merges: 1, clock: 15_000 });
});

test('a previously successful real PR run is reused without approval or another build', async () => {
  const f = approvalFixture({ status: 'success' });
  await approveAndMergeRefresh(f.api, f.proposal, f.options);
  assert.deepEqual(f.counts(), { approvals: 0, merges: 1, clock: 0 });
});

test('extra files, a different head or a human author are rejected before approval', async () => {
  for (const change of [
    (v) => { v.files.push({ filename: 'README.md', status: 'modified' }); },
    (v) => { v.pr.head.sha = 'e'.repeat(40); },
    (v) => { v.pr.user.login = 'someone'; },
  ]) {
    const f = approvalFixture({ change });
    await assert.rejects(approveAndMergeRefresh(f.api, f.proposal, f.options));
    assert.equal(f.counts().approvals, 0); assert.equal(f.counts().merges, 0);
  }
});

test('approval refusal fails with the exact run URL and never merges or bypasses checks', async () => {
  for (const deny of [403, 422]) {
    const f = approvalFixture({ deny });
    await assert.rejects(approveAndMergeRefresh(f.api, f.proposal, f.options), new RegExp(`cannot approve.*HTTP ${deny}.*actions/runs/42`));
    assert.equal(f.counts().merges, 0);
  }
});

test('failed real checks stop immediately and absent runs stop within the bounded wait', async () => {
  const failed = approvalFixture({ status: 'failure' });
  await assert.rejects(approveAndMergeRefresh(failed.api, failed.proposal, failed.options), /required PR build did not pass/);
  assert.equal(failed.counts().merges, 0);
  const absent = approvalFixture();
  await assert.rejects(approveAndMergeRefresh(async () => ({ workflow_runs: [] }), absent.proposal, absent.options), /Timed out/);
  assert.equal(absent.counts().clock, 15 * 60_000);
});

test('empty successful approval API responses are accepted', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 201 }));
  assert.equal(await createGitHubApi('test')('/actions/runs/42/approve', 'POST'), undefined);
});

test('a run completed by another approval is reused without a stale approval request', async () => {
  const f = approvalFixture();
  const inspect = f.options.inspect;
  f.options.inspect = async (...args) => { const value = await inspect(...args); value.run.status = 'completed'; value.run.conclusion = 'success'; return value; };
  await approveAndMergeRefresh(f.api, f.proposal, f.options);
  assert.equal(f.counts().approvals, 0);
  assert.equal(f.counts().merges, 1);
});


test('an existing PR can report its previous head briefly after the atomic branch update', async () => {
  const f = fixture({ initialHead: proposal, existingPr: pr(), previousMain: 'd'.repeat(40), stalePrReads: 2 });
  let waits = 0;
  const result = await refreshReleases(f.api, manifest('1.0.3').dependencies, { sleep: async () => { waits++; } });
  assert.equal(result.head, newer);
  assert.equal(waits, 2);
  assert.equal(f.calls.filter((c) => c.endpoint === '/pulls' && c.method === 'POST').length, 0);
});

test('a branch edit during PR propagation is rejected without overwriting it', async () => {
  const f = fixture({ initialHead: proposal, existingPr: pr(), previousMain: 'd'.repeat(40), stalePrReads: 50 });
  await assert.rejects(refreshReleases(f.api, manifest('1.0.3').dependencies, {
    sleep: async () => { f.refs.set(refreshBranch, 'e'.repeat(40)); },
  }), /refresh branch changed/);
  assert.equal(f.refs.get(refreshBranch), 'e'.repeat(40));
});

test('PR propagation waits are bounded if GitHub never reports the new head', async () => {
  const f = fixture({ initialHead: proposal, existingPr: pr(), previousMain: 'd'.repeat(40), stalePrReads: 50 });
  let waits = 0;
  await assert.rejects(refreshReleases(f.api, manifest('1.0.3').dependencies, { sleep: async () => { waits++; } }), /not reported the updated PR head/);
  assert.equal(waits, 30);
});
