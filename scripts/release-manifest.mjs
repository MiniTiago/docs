import { readFile } from 'node:fs/promises';

export const releaseManifestPath = 'releases/package.json';
export const sdkPackages = ['@siebly/hyperliquid-api', 'bybit-api', 'binance'];
export const stableVersion = (version) => typeof version === 'string' && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version);

export function releaseVersions(manifest) {
  if (!manifest || manifest.name !== 'siebly-sdk-release-inputs' || manifest.private !== true || Object.keys(manifest).sort().join(',') !== 'dependencies,name,private') throw new Error('Unexpected release manifest structure');
  const versions = manifest.dependencies;
  if (!versions || Object.keys(versions).sort().join(',') !== [...sdkPackages].sort().join(',') || sdkPackages.some((name) => !stableVersion(versions[name]))) throw new Error('Release inputs must contain exactly the three SDKs at exact stable versions');
  return { ...versions };
}

export async function readReleaseVersions() {
  return releaseVersions(JSON.parse(await readFile(new URL('../releases/package.json', import.meta.url), 'utf8')));
}

export function validateReleaseUpdate(before, after) {
  const previous = releaseVersions(before), next = releaseVersions(after);
  const changed = sdkPackages.filter((name) => previous[name] !== next[name]);
  if (!changed.length) throw new Error('No SDK release versions changed');
  for (const name of changed) {
    const a = previous[name].split('.').map(BigInt), b = next[name].split('.').map(BigInt);
    const position = a.findIndex((part, index) => part !== b[index]);
    if (b[position] <= a[position]) throw new Error(`SDK release would move backwards: ${name}`);
  }
  return changed;
}
