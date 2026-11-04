import { appendFile } from 'node:fs/promises';
import { releaseManifestPath } from './release-manifest.mjs';

export const repository = 'sieblyio/docs';
export const refreshBranch = 'automation/refresh-sdk-releases';
export const sha = (value) => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
export const requireThat = (condition, message) => { if (!condition) throw new Error(message); };

export function requireMainDispatch(env) {
  requireThat(env.GITHUB_REPOSITORY === repository && env.GITHUB_REF === 'refs/heads/main' && env.GITHUB_EVENT_NAME === 'workflow_dispatch', 'Refresh SDK releases only runs on sieblyio/docs main');
}

export function createGitHubApi(token) {
  requireThat(token, 'The temporary GitHub Actions token is required');
  return async function api(endpoint, method = 'GET', body) {
    const url = endpoint === '/graphql' ? 'https://api.github.com/graphql' : `https://api.github.com/repos/${repository}${endpoint}`;
    for (let attempt = 0; ; attempt++) {
      let response;
      try {
        response = await fetch(url, { method, signal: AbortSignal.timeout(30_000),
          headers: { Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2026-03-10' },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
      } catch (error) { if (attempt === 2) throw error; }
      if (response?.ok) {
        const text = await response.text();
        const result = text ? JSON.parse(text) : undefined;
        requireThat(!result?.errors?.length, 'GitHub rejected the atomic branch operation; rerun after checking the refresh branch');
        return result;
      }
      if (response && (attempt === 2 || (response.status !== 429 && response.status < 500))) {
        const error = new Error(`GitHub API ${method} ${endpoint}: HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  };
}

export async function manifestAt(api, revision) {
  requireThat(sha(revision), 'Manifest revision is invalid');
  const file = await api(`/contents/${releaseManifestPath}?ref=${revision}`);
  requireThat(file.type === 'file' && file.encoding === 'base64' && file.size < 16_384, 'Unexpected release manifest file');
  return JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
}

export async function summary(message) {
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, message + '\n');
}

export async function dispatchPublication(api, ref) {
  requireThat(ref === 'main' || ref === refreshBranch, 'Unsupported publication dispatch ref');
  return api('/actions/workflows/publish.yml/dispatches', 'POST', { ref });
}
