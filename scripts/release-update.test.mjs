import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibleRun, validateCandidate } from './release-update.mjs';
import { refreshBranch } from './github-automation.mjs';
import { readReleaseVersions, releaseVersions, validateReleaseUpdate } from './release-manifest.mjs';

const main = 'a'.repeat(40), head = 'b'.repeat(40);
const manifest = () => ({ name: 'siebly-sdk-release-inputs', private: true, dependencies: { '@siebly/hyperliquid-api': '1.0.1', 'bybit-api': '4.8.4', binance: '3.6.11' } });
function candidate() {
  const before = manifest(), after = manifest();
  after.dependencies['bybit-api'] = '4.8.5';
  return {
    run: { event: 'pull_request', status: 'completed', conclusion: 'success', path: '.github/workflows/publish.yml', actor: { login: 'dependabot[bot]' }, repository: { full_name: 'sieblyio/docs' }, head_repository: { full_name: 'sieblyio/docs' }, head_sha: head, head_branch: 'dependabot/npm_and_yarn/releases/sdk-releases' },
    pr: { state: 'open', draft: false, merged: false, changed_files: 1, user: { login: 'dependabot[bot]', type: 'Bot' }, base: { ref: 'main', repo: { full_name: 'sieblyio/docs' } }, head: { sha: head, ref: 'dependabot/npm_and_yarn/releases/sdk-releases', repo: { full_name: 'sieblyio/docs' } } },
    jobs: [{ name: 'build', status: 'completed', conclusion: 'success' }],
    files: [{ filename: 'releases/package.json', status: 'modified' }], mainSha: main, mergeBaseSha: main, before, after,
  };
}

test('the committed manifest is the exact three-package build input', async () => {
  assert.deepEqual(Object.keys(await readReleaseVersions()).sort(), ['@siebly/hyperliquid-api', 'binance', 'bybit-api']);
  for (const version of ['latest', '^4.8.5', '4.8.5-beta.1', '04.8.5']) {
    const value = manifest(); value.dependencies['bybit-api'] = version;
    assert.throws(() => releaseVersions(value));
  }
  const extra = manifest(); extra.dependencies.other = '1.0.0';
  assert.throws(() => releaseVersions(extra));
  assert.throws(() => releaseVersions({ ...manifest(), scripts: { install: 'unexpected' } }));
});

test('only exact increasing SDK versions can merge, including grouped changes', () => {
  const value = candidate();
  value.after.dependencies.binance = '3.7.0';
  assert.deepEqual(validateCandidate(value).changed.sort(), ['binance', 'bybit-api']);
  assert.throws(() => validateReleaseUpdate(value.before, value.before), /No SDK release/);
  value.after.dependencies['bybit-api'] = '4.8.3';
  assert.throws(() => validateCandidate(value), /backwards/);
});

test('forks, human authors, actions updates and extra files are rejected', () => {
  for (const change of [
    (v) => { v.run.actor.login = 'someone'; },
    (v) => { v.pr.user.login = 'someone'; },
    (v) => { v.pr.head.repo.full_name = 'someone/docs'; },
    (v) => { v.run.head_repository.full_name = 'someone/docs'; },
    (v) => { v.pr.base.ref = 'other'; },
    (v) => { v.files[0].filename = '.github/workflows/publish.yml'; },
    (v) => { v.files[0].status = 'renamed'; },
    (v) => { v.pr.changed_files = 2; },
    (v) => { v.files.push({ filename: 'scripts/build.mjs', status: 'modified' }); },
  ]) { const value = candidate(); change(value); assert.throws(() => validateCandidate(value)); }
});

test('stale heads, stale bases, failed/skipped current builds and unready PRs are rejected', () => {
  for (const change of [
    (v) => { v.pr.head.sha = 'c'.repeat(40); },
    (v) => { v.pr.head.ref = 'another-branch'; },
    (v) => { v.mergeBaseSha = 'c'.repeat(40); },
    (v) => { v.run.status = 'in_progress'; },
    (v) => { v.run.conclusion = 'failure'; },
    (v) => { v.jobs[0].conclusion = 'skipped'; },
    (v) => { v.jobs[0].conclusion = 'failure'; },
    (v) => { v.jobs = []; },
    (v) => { v.pr.draft = true; },
    (v) => { v.pr.state = 'closed'; },
    (v) => { v.pr.merged = true; },
  ]) { const value = candidate(); change(value); assert.throws(() => validateCandidate(value)); }
});

test('dispatch retries accept only the same validated head already squash-merged by native automation', () => {
  const value = candidate();
  Object.assign(value.pr, { state: 'closed', merged: true, merged_by: { login: 'github-actions[bot]' }, merge_commit_sha: 'c'.repeat(40) });
  value.mergeBaseSha = undefined;
  assert.equal(validateCandidate(value).alreadyMerged, true);
  value.pr.merged_by.login = 'someone';
  assert.throws(() => validateCandidate(value), /confirmed automation merge/);
  value.pr.merged_by.login = 'github-actions[bot]';
  value.pr.head.sha = 'd'.repeat(40);
  assert.throws(() => validateCandidate(value), /head changed/);
});

test('non-PR and unsuccessful runs cannot enter privileged release processing', () => {
  for (const event of ['push', 'workflow_dispatch', 'schedule']) assert.equal(eligibleRun({ ...candidate().run, event }), false);
  assert.equal(eligibleRun({ ...candidate().run, head_sha: '../main' }), false);
  assert.equal(eligibleRun({ ...candidate().run, path: '.github/workflows/other.yml' }), false);
});

test('only bot-dispatched builds on the reserved refresh branch can validate manual refresh PRs', () => {
  const value = candidate();
  Object.assign(value.run, { event: 'workflow_dispatch', actor: { login: 'github-actions[bot]' }, head_branch: refreshBranch });
  value.pr.user.login = 'github-actions[bot]';
  value.pr.head.ref = refreshBranch;
  assert.equal(validateCandidate(value).alreadyMerged, false);
  for (const change of [
    (v) => { v.run.actor.login = 'someone'; },
    (v) => { v.pr.user.login = 'someone'; },
    (v) => { v.run.head_branch = v.pr.head.ref = 'arbitrary-branch'; },
    (v) => { v.run.event = 'pull_request'; },
    (v) => { v.pr.head.sha = 'e'.repeat(40); },
    (v) => { v.files.push({ filename: 'README.md', status: 'modified' }); },
  ]) { const invalid = structuredClone(value); change(invalid); assert.throws(() => validateCandidate(invalid)); }
  Object.assign(value.pr, { state: 'closed', merged: true, merged_by: { login: 'github-actions[bot]' }, merge_commit_sha: 'c'.repeat(40) });
  assert.equal(validateCandidate(value).alreadyMerged, true, 'Manual refresh merges retain dispatch recovery');
});
