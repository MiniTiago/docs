import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { catalogue } from './context.mjs';
import { trustedReleaseRun, inspectReleaseRun, validateReleasePR, mergeReleaseRun } from './release-update.mjs';
import { releaseManifestPath, releaseVersions, validateReleaseUpdate, validateRelease } from './release-manifest.mjs';
import { repository, refreshBranch, requireThat, requireMainDispatch, createGitHubApi, manifestAt, summary, sha } from './github-automation.mjs';

export function updatedManifest(before, latest) {
  const previous = releaseVersions(before);
  const after = { ...before, dependencies: { ...latest } };
  const next = releaseVersions(after);
  if (Object.keys(previous).every((name) => previous[name] === next[name])) return;
  validateReleaseUpdate(before, after);
  return after;
}

export function validateRefreshBranch({ comparison, prs, head, branchManifest, desired }) {
  requireThat(prs.length <= 1, 'Multiple open PRs use the reserved refresh branch');
  for (const pr of prs) requireThat(pr.user?.login === 'github-actions[bot]' && pr.user?.type === 'Bot' && pr.head?.repo?.full_name === repository && pr.head?.ref === refreshBranch && pr.head?.sha === head && pr.base?.repo?.full_name === repository && pr.base?.ref === 'main', 'The refresh branch has a PR outside this automation');
  if (!comparison.files.length && !comparison.total_commits) return;
  requireThat(comparison.files.length === 1 && comparison.files[0].filename === releaseManifestPath && comparison.files[0].status === 'modified', 'The refresh branch contains changes outside the SDK release manifest');
  requireThat(comparison.total_commits === 1 && comparison.commits.length === 1 && comparison.commits[0].author?.login === 'github-actions[bot]', 'The refresh branch contains commits outside this automation');
  // Never reduce a pending proposal, even if an npm latest tag has moved backwards.
  updatedManifest(branchManifest, releaseVersions(desired));
}

export async function readLatestVersions() {
  const versions = {};
  for (const sdk of await catalogue()) {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(sdk.packageName)}/latest`, { signal: AbortSignal.timeout(30_000) });
    requireThat(response.ok, `npm metadata unavailable for ${sdk.packageName}: HTTP ${response.status}`);
    versions[sdk.packageName] = validateRelease(sdk, await response.json()).version;
  }
  return versions;
}

export async function refreshReleases(api, latest, { sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  const main = (await api('/git/ref/heads/main')).object.sha;
  const before = await manifestAt(api, main);
  const desired = updatedManifest(before, latest);
  if (!desired) return { changed: false };
  const query = new URLSearchParams({ state: 'open', head: `sieblyio:${refreshBranch}`, per_page: '100' });
  let prs = await api(`/pulls?${query}`);
  let head;
  try { head = (await api(`/git/ref/heads/${refreshBranch}`)).object.sha; }
  catch (error) { if (error.status !== 404) throw error; }
  let reuse = false;
  if (head) {
    const comparison = await api(`/compare/${main}...${head}`);
    const branchManifest = await manifestAt(api, head);
    validateRefreshBranch({ comparison, prs, head, branchManifest, desired });
    reuse = comparison.merge_base_commit.sha === main && !updatedManifest(branchManifest, releaseVersions(desired));
  } else requireThat(prs.length === 0, 'A refresh PR exists without its branch');
  if (!reuse) {
    const repo = await api('');
    const baseCommit = await api(`/git/commits/${main}`);
    const tree = await api('/git/trees', 'POST', { base_tree: baseCommit.tree.sha, tree: [{ path: releaseManifestPath, mode: '100644', type: 'blob', content: JSON.stringify(desired, null, 2) + '\n' }] });
    const commit = await api('/git/commits', 'POST', { message: 'Refresh SDK release versions', tree: tree.sha, parents: [main], author: { name: 'github-actions[bot]', email: '41898282+github-actions[bot]@users.noreply.github.com' } });
    requireThat(sha(commit.sha), 'GitHub did not return the refresh commit');
    // Compare-and-swap preserves edits made after the bot-branch ownership check.
    await api('/graphql', 'POST', { query: 'mutation($input:UpdateRefsInput!){updateRefs(input:$input){clientMutationId}}', variables: { input: { repositoryId: repo.node_id, refUpdates: [{ name: `refs/heads/${refreshBranch}`, beforeOid: head || '0'.repeat(40), afterOid: commit.sha, force: true }] } } });
    head = commit.sha;
    // Query again so retries after PR creation or branch update reuse the existing PR.
    prs = await api(`/pulls?${query}`);
  }
  requireThat(prs.length <= 1, 'Multiple open refresh PRs exist');
  let pr = prs[0];
  if (pr) {
    const ownedPR = () => requireThat(pr.state === 'open' && pr.user?.login === 'github-actions[bot]' && pr.user?.type === 'Bot' && pr.head?.repo?.full_name === repository && pr.head.ref === refreshBranch && pr.base?.repo?.full_name === repository && pr.base.ref === 'main', 'The refresh PR changed during this run');
    ownedPR();
    // GitHub updates the branch before its PR response reflects the new head.
    for (let attempt = 0; pr.head.sha !== head && attempt < 30; attempt++) {
      requireThat((await api(`/git/ref/heads/${refreshBranch}`)).object.sha === head, 'The refresh branch changed while waiting for its PR');
      await sleep(2_000);
      pr = await api(`/pulls/${pr.number}`);
      ownedPR();
    }
    requireThat(pr.head.sha === head, `GitHub has not reported the updated PR head: ${pr.html_url}. Rerun Refresh SDK releases to continue.`);
  } else pr = await api('/pulls', 'POST', { title: 'Refresh SDK release versions', head: refreshBranch, base: 'main', body: 'Updates the SDK release manifest from npm latest. The documentation build validates the proposed releases before the protected merge and publication.' });
  return { changed: true, pr: pr.html_url, number: pr.number, head };
}

export async function approveAndMergeRefresh(api, proposal, { now = Date.now, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), inspect = inspectReleaseRun, merge = mergeReleaseRun } = {}) {
  const deadline = now() + 15 * 60_000;
  let approved;
  while (now() < deadline) {
    const runs = await api(`/actions/workflows/publish.yml/runs?event=pull_request&head_sha=${proposal.head}&per_page=100`);
    const run = runs.workflow_runs.find((value) => trustedReleaseRun(value) && value.actor.login === 'github-actions[bot]' && value.head_sha === proposal.head);
    if (run) {
      const link = run.html_url || `https://github.com/${repository}/actions/runs/${run.id}`;
      if (run.status === 'completed' && run.conclusion === 'success') return merge(api, run.id);
      if (run.conclusion === 'action_required') {
        if (approved !== run.id) {
          const candidate = await inspect(api, run.id);
          requireThat(candidate && candidate.pr.number === proposal.number && candidate.run.head_sha === proposal.head, `The refresh PR/run changed: ${link}`);
          validateReleasePR(candidate);
          if (candidate.run.status === 'completed' && candidate.run.conclusion === 'success') return merge(api, run.id);
          try { if (candidate.run.conclusion === 'action_required') await api(`/actions/runs/${run.id}/approve`, 'POST'); }
          catch (error) {
            if ([403, 422].includes(error.status)) throw new Error(`The temporary token cannot approve the required PR workflow (HTTP ${error.status}): ${link}. No merge or publication was attempted.`);
            throw error;
          }
          approved = run.id;
        }
      } else requireThat(run.status !== 'completed', `The required PR build did not pass: ${link}`);
    }
    await sleep(15_000);
  }
  throw new Error(`Timed out waiting for the real PR build: ${proposal.pr}. Rerun Refresh SDK releases to continue.`);
}

async function main() {
  requireMainDispatch(process.env);
  const api = createGitHubApi(process.env.GH_TOKEN);
  const result = await refreshReleases(api, await readLatestVersions());
  if (!result.changed) { await summary('The SDK release manifest already matches npm latest. No PR or build was created.'); return; }
  await summary(`SDK refresh PR: ${result.pr}`);
  await summary(await approveAndMergeRefresh(api, result));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
