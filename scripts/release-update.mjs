import { readFile, appendFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { releaseManifestPath, validateReleaseUpdate } from './release-manifest.mjs';

const repository = 'sieblyio/docs';
const sha = (value) => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };

export function eligibleRun(run) {
  return run.event === 'pull_request' && run.status === 'completed' && run.conclusion === 'success' &&
    run.path === '.github/workflows/publish.yml' && run.actor?.login === 'dependabot[bot]' &&
    run.repository?.full_name === repository && run.head_repository?.full_name === repository && sha(run.head_sha);
}

export function validateCandidate({ run, pr, jobs, files, mainSha, mergeBaseSha, before, after }) {
  requireThat(eligibleRun(run), 'Run is not a successful Dependabot documentation PR build');
  const alreadyMerged = pr.state === 'closed' && pr.merged === true;
  requireThat(!pr.draft && ((pr.state === 'open' && !pr.merged) || (alreadyMerged && pr.merged_by?.login === 'github-actions[bot]' && sha(pr.merge_commit_sha))), 'PR is not open or a confirmed automation merge');
  requireThat(pr.user?.login === 'dependabot[bot]' && pr.user?.type === 'Bot', 'PR author is not Dependabot');
  requireThat(pr.base?.repo?.full_name === repository && pr.head?.repo?.full_name === repository && pr.base.ref === 'main', 'PR must originate in this repository and target main');
  requireThat(pr.head.sha === run.head_sha && pr.head.ref === run.head_branch, 'PR head changed after the successful build');
  const builds = jobs.filter((job) => job.name === 'build');
  requireThat(builds.length === 1 && builds[0].status === 'completed' && builds[0].conclusion === 'success', 'The current build job did not pass');
  if (!alreadyMerged) requireThat(sha(mainSha) && mergeBaseSha === mainSha, 'PR must be up to date with current main');
  requireThat(pr.changed_files === 1 && files.length === 1 && files[0].filename === releaseManifestPath && files[0].status === 'modified', 'PR changes files outside the SDK release manifest');
  return { changed: validateReleaseUpdate(before, after), alreadyMerged };
}

async function main() {
  requireThat(process.env.GITHUB_REPOSITORY === repository && process.env.GITHUB_REF === 'refs/heads/main', 'Release automation only runs on sieblyio/docs main');
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const dryRun = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';
  requireThat(dryRun || process.env.GITHUB_EVENT_NAME === 'workflow_run', 'Unsupported release automation event');
  const runId = String(dryRun ? event.inputs?.run_id : event.workflow_run?.id);
  requireThat(/^[1-9]\d*$/.test(runId), 'A workflow run ID is required');
  requireThat(process.env.GH_TOKEN, 'The temporary GitHub Actions token is required');
  const base = `https://api.github.com/repos/${repository}`;
  async function api(endpoint, method = 'GET', body) {
    for (let attempt = 0; ; attempt++) {
      let response;
      try {
        response = await fetch(`${base}${endpoint}`, { method, signal: AbortSignal.timeout(30_000),
          headers: { Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GH_TOKEN}`, 'X-GitHub-Api-Version': '2026-03-10' },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
      } catch (error) { if (attempt === 2) throw error; }
      if (response?.ok) return response.status === 204 ? undefined : response.json();
      if (response && (attempt === 2 || (response.status !== 429 && response.status < 500))) throw new Error(`GitHub API ${method} ${endpoint}: HTTP ${response.status}`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  async function summary(message) {
    console.log(message);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, message + '\n');
  }
  const run = await api(`/actions/runs/${runId}`);
  if (!eligibleRun(run)) { await summary('No merge: this is not an eligible successful Dependabot release run.'); return; }
  // Commit association also finds a merged PR when retrying after a dispatch failure.
  const prs = (await api(`/commits/${run.head_sha}/pulls?per_page=100`)).filter((pr) =>
    pr.user?.login === 'dependabot[bot]' && pr.base?.ref === 'main' && pr.base?.repo?.full_name === repository &&
    pr.head?.repo?.full_name === repository && pr.head?.sha === run.head_sha && pr.head?.ref === run.head_branch);
  if (prs.length !== 1) { await summary('No merge: no unique Dependabot PR matches the completed run.'); return; }
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
  } else {
    mergeBaseSha = (await api(`/compare/${mainSha}...${run.head_sha}`)).merge_base_commit.sha;
  }
  async function manifestAt(revision) {
    requireThat(sha(revision), 'Manifest revision is invalid');
    const file = await api(`/contents/${releaseManifestPath}?ref=${revision}`);
    requireThat(file.type === 'file' && file.encoding === 'base64' && file.size < 16_384, 'Unexpected release manifest file');
    return JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
  }
  const before = await manifestAt(beforeRevision), after = await manifestAt(run.head_sha);
  let decision;
  try { decision = validateCandidate({ run, pr, jobs, files, mainSha, mergeBaseSha, before, after }); }
  catch (error) { await summary(`No merge: ${error.message}.`); return; }
  if (dryRun) { await summary(`Read-only inspection passed for Dependabot PR #${pr.number}; no merge or dispatch performed.`); return; }
  // GitHub enforces required checks and strict up-to-date protection. Never use an admin bypass or queue an asynchronous auto-merge.
  if (!decision.alreadyMerged) await promisify(execFile)('gh', ['pr', 'merge', String(pr.number), '--repo', repository, '--squash', '--match-head-commit', run.head_sha], { env: process.env });
  const merged = await api(`/pulls/${pr.number}`);
  requireThat(merged.merged === true && merged.head.sha === run.head_sha && sha(merged.merge_commit_sha), 'Merge completion was not confirmed; dispatch publish.yml manually if needed');
  await api('/actions/workflows/publish.yml/dispatches', 'POST', { ref: 'main' });
  await summary(`${decision.alreadyMerged ? 'Confirmed prior merge of' : 'Merged'} Dependabot PR #${pr.number} (${decision.changed.join(', ')}) and dispatched the main documentation build.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
