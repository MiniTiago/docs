import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './context.mjs';
import { resolveReleases } from './releases.mjs';

export function canDeploy({ eventName, ref, repository }) {
  return repository === 'sieblyio/docs' && ref === 'refs/heads/main' && ['push', 'workflow_dispatch'].includes(eventName);
}

async function main() {
  const releases = await resolveReleases();
  const deploy = canDeploy({ eventName: process.env.GITHUB_EVENT_NAME, ref: process.env.GITHUB_REF, repository: process.env.GITHUB_REPOSITORY });
  await mkdir(path.join(root, '.work'), { recursive: true });
  await writeFile(path.join(root, '.work/available-releases.json'), JSON.stringify(releases, null, 2) + '\n');
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `deploy=${deploy}\n`);
  console.log(`Building pinned releases: ${Object.values(releases).map((r) => `${r.packageName}@${r.version}`).join(', ')}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
