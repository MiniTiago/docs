import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { releaseManifestPath, validateReleaseUpdate } from './release-manifest.mjs';
import { repository, refreshBranch, sha, requireThat, createGitHubApi, manifestAt, summary, dispatchPublication } from './github-automation.mjs';

export function releaseAuthor(run) {
  if (run.event === 'pull_request' && run.actor?.login === 'dependabot[bot]' && run.head_branch !== refreshBranch) return 'dependabot[bot]';
  if (run.event === 'pull_request' && run.actor?.login === 'github-actions[bot]' && run.head_branch === refreshBranch) return 'github-actions[bot]';
}

export function trustedReleaseRun(run) {
  return Boolean(releaseAuthor(run)) && run.path === '.github/workflows/publish.yml' &&
    run.repository?.full_name === repository && run.head_repository?.full_name === repository && sha(run.head_sha);
}

export function eligibleRun(run) {
  return trustedReleaseRun(run) && run.status === 'completed' && run.conclusion === 'success';
}

export function validateReleasePR({ run, pr, files, mainSha, mergeBaseSha, before, after }) {
  requireThat(trustedReleaseRun(run), 'Run is not a trusted SDK release PR build');
  const alreadyMerged = pr.state === 'closed' && pr.merged === true;
  requireThat(!pr.draft && ((pr.state === 'open' && !pr.merged) || (alreadyMerged && pr.merged_by?.login === 'github-actions[bot]' && sha(pr.merge_commit_sha))), 'PR is not open or a confirmed automation merge');
  requireThat(pr.user?.login === releaseAuthor(run) && pr.user?.type === 'Bot', 'PR author does not match the release automation');
  requireThat(pr.base?.repo?.full_name === repository && pr.head?.repo?.full_name === repository && pr.base.ref === 'main', 'PR must originate in this repository and target main');
  requireThat(pr.head.sha === run.head_sha && pr.head.ref === run.head_branch, 'PR head changed after the selected build');
  if (!alreadyMerged) requireThat(sha(mainSha) && mergeBaseSha === mainSha, 'PR must be up to date with current main');
  requireThat(pr.changed_files === 1 && files.length === 1 && files[0].filename === releaseManifestPath && files[0].status === 'modified', 'PR changes files outside the SDK release manifest');
  return { changed: validateReleaseUpdate(before, after), alreadyMerged };
}

export function validateCandidate(candidate) {
  requireThat(eligibleRun(candidate.run), 'Run is not a successful trusted SDK release build');
  const builds = candidate.jobs.filter((job) => job.name === 'build');
  requireThat(builds.length === 1 && builds[0].status === 'completed' && builds[0].conclusion === 'success', 'The current build job did not pass');
  return validateReleasePR(candidate);
}

export async function inspectReleaseRun(api, runId) {
  requireThat(/^[1-9]\d*$/.test(String(runId)), 'A workflow run ID is required');
  const run = await api(`/actions/runs/${runId}`);
  if (!trustedReleaseRun(run)) return;
  const prs = (await api(`/commits/${run.head_sha}/pulls?per_page=100`)).filter((pr) =>
    pr.user?.login === releaseAuthor(run) && pr.base?.ref === 'main' && pr.base?.repo?.full_name === repository &&
    pr.head?.repo?.full_name === repository && pr.head?.sha === run.head_sha && pr.head?.ref === run.head_branch);
  if (prs.length !== 1) return;
  const pr = await api(`/pulls/${prs[0].number}`);
  const mainSha = (await api('/git/ref/heads/main')).object.sha;
  requireThat(sha(mainSha), 'Current main SHA is invalid');
  const jobs = (await api(`/actions/runs/${runId}/jobs?filter=latest&per_page=100`)).jobs;
  const files = await api(`/pulls/${pr.number}/files?per_page=100`);
  let beforeRevision = mainSha, mergeBaseSha;
  if (pr.merged) {
    requireThat(sha(pr.merge_commit_sha), 'Merged PR has no exact merge revision');
    const commit = await api(`/git/commits/${pr.merge_commit_sha}`);
    requireThat(commit.parents.length === 1, 'Expected a completed squash merge');
    beforeRevision = commit.parents[0].sha;
  } else mergeBaseSha = (await api(`/compare/${mainSha}...${run.head_sha}`)).merge_base_commit.sha;
  const before = await manifestAt(api, beforeRevision), after = await manifestAt(api, run.head_sha);
  return { run, pr, jobs, files, mainSha, mergeBaseSha, before, after };
}

export async function mergeReleaseRun(api, runId, { dryRun = false } = {}) {
  const candidate = await inspectReleaseRun(api, runId);
  requireThat(candidate, 'No unique trusted SDK release PR matches this run');
  const decision = validateCandidate(candidate);
  const { run, pr } = candidate;
  if (dryRun) return `Read-only inspection passed for SDK release PR #${pr.number}; no merge or dispatch performed.`;
  if (!decision.alreadyMerged) await promisify(execFile)('gh', ['pr', 'merge', String(pr.number), '--repo', repository, '--squash', '--match-head-commit', run.head_sha], { env: process.env });
  const merged = await api(`/pulls/${pr.number}`);
  requireThat(merged.merged === true && merged.head.sha === run.head_sha && sha(merged.merge_commit_sha), 'Merge completion was not confirmed; rerun this job to recover');
  await dispatchPublication(api, 'main');
  return `${decision.alreadyMerged ? 'Confirmed prior merge of' : 'Merged'} SDK release PR #${pr.number} (${decision.changed.join(', ')}) and dispatched the main documentation build.`;
}

async function main() {
  requireThat(process.env.GITHUB_REPOSITORY === repository && process.env.GITHUB_REF === 'refs/heads/main', 'Release automation only runs on sieblyio/docs main');
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const dryRun = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';
  requireThat(dryRun || process.env.GITHUB_EVENT_NAME === 'workflow_run', 'Unsupported release automation event');
  const runId = String(dryRun ? event.inputs?.run_id : event.workflow_run?.id);
  await summary(await mergeReleaseRun(createGitHubApi(process.env.GH_TOKEN), runId, { dryRun }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
