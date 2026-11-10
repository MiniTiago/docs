import { readFile } from 'node:fs/promises';

export const releaseManifestPath = 'releases/package.json';
export const sdkPackages = ['@siebly/hyperliquid-api', 'bybit-api', 'binance', '@siebly/kraken-api'];
export const stableVersion = (version) => typeof version === 'string' && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version);

export function releaseVersions(manifest) {
  if (!manifest || manifest.name !== 'siebly-sdk-release-inputs' || manifest.private !== true || Object.keys(manifest).sort().join(',') !== 'dependencies,name,private') throw new Error('Unexpected release manifest structure');
  const versions = manifest.dependencies;
  if (!versions || Object.keys(versions).sort().join(',') !== [...sdkPackages].sort().join(',') || sdkPackages.some((name) => !stableVersion(versions[name]))) throw new Error('Release inputs must contain exactly the configured SDKs at exact stable versions');
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

export function validateRelease(sdk, metadata) {
  if (metadata.name !== sdk.packageName || !/^\d+\.\d+\.\d+$/.test(metadata.version)) throw new Error(`Invalid stable release for ${sdk.packageName}`);
  const repository = typeof metadata.repository === 'string' ? metadata.repository : metadata.repository?.url;
  if (repository?.replace(/^git\+/, '').replace(/\.git$/, '') !== sdk.repository) throw new Error(`Unexpected repository for ${sdk.packageName}`);
  if (!/^https:\/\/registry\.npmjs\.org\//.test(metadata.dist?.tarball || '') || !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(metadata.dist?.integrity || '')) throw new Error(`Missing trusted npm archive/integrity for ${sdk.packageName}`);
  if (metadata.gitHead && !/^[a-f0-9]{40}$/.test(metadata.gitHead)) throw new Error('Invalid npm gitHead');
  return { packageName: metadata.name, version: metadata.version, repository: sdk.repository,
    npmTarball: metadata.dist.tarball, npmIntegrity: metadata.dist.integrity, ...(metadata.gitHead ? { gitHead: metadata.gitHead } : {}) };
}
