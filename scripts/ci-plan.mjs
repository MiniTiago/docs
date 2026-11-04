import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './context.mjs';
import { resolveLatest, versionsChanged } from './releases.mjs';

export const publishedManifestUrl = 'https://sieblyio.github.io/docs/build-manifest.json';

export async function readPublishedManifest(fetchManifest = fetch) {
  const response = await fetchManifest(publishedManifestUrl, { signal: AbortSignal.timeout(30_000), cache: 'no-store' });
  if (response.ok) return response.json();
  if (response.status === 404) return undefined;
  throw new Error(`Cannot read published manifest: ${response.status}`);
}

export function planBuild({ eventName, ref, repository, revision }, releases, manifest) {
  const sourceChanged = !revision || manifest?.documentationRevision !== revision;
  const build = eventName !== 'schedule' || sourceChanged || versionsChanged(releases, manifest);
  const deploy = build && repository === 'sieblyio/docs' && ref === 'refs/heads/main' && ['push', 'workflow_dispatch', 'schedule'].includes(eventName);
  return { build, deploy };
}

async function main() {
  const releases = await resolveLatest();
  const eventName = process.env.GITHUB_EVENT_NAME;
  // Content changes and PR checks do not depend on the availability of the live site.
  const manifest = eventName === 'schedule' ? await readPublishedManifest() : undefined;
  const plan = planBuild({ eventName, ref: process.env.GITHUB_REF, repository: process.env.GITHUB_REPOSITORY, revision: process.env.GITHUB_SHA }, releases, manifest);
  await mkdir(path.join(root, '.work'), { recursive: true });
  await writeFile(path.join(root, '.work/available-releases.json'), JSON.stringify(releases, null, 2) + '\n');
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `build=${plan.build}\ndeploy=${plan.deploy}\n`);
  console.log(plan.build ? `Build required: ${Object.values(releases).map((r) => `${r.packageName}@${r.version}`).join(', ')}` : 'Published release versions and documentation revision unchanged; skipping build and deployment.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
