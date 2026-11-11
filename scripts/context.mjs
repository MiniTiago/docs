import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ids = ['hyperliquid', 'bybit', 'binance', 'kraken', 'coinbase'];

export async function context(id) {
  if (!ids.includes(id)) throw new Error(`Unknown SDK: ${id}. Choose ${ids.join(', ')}.`);
  const { default: sdk } = await import(`../sdks/${id}/sdk.config.mjs`);
  let release;
  if (!process.env.SDK_ROOT) {
    try { release = JSON.parse(await readFile(path.join(root, '.work/releases.json'), 'utf8'))[id]; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!release) throw new Error('Prepare published SDK sources first with npm run build:release.');
  }
  const sdkRoot = path.resolve(process.env.SDK_ROOT || release.sourcePath);
  const pkg = JSON.parse(await readFile(path.join(sdkRoot, 'package.json'), 'utf8'));
  if (pkg.name !== sdk.packageName) throw new Error(`Expected ${sdk.packageName}, received ${pkg.name}`);
  if (release && (pkg.name !== release.packageName || pkg.version !== release.version)) throw new Error('Prepared source does not match its release record.');
  if (process.env.SDK_VERSION && pkg.version !== process.env.SDK_VERSION) {
    throw new Error(`Source version ${pkg.version} does not match requested release ${process.env.SDK_VERSION}`);
  }
  const projectRoot = path.join(root, '.work', id);
  const origin = new URL(process.env.DOCS_SITE_URL || 'http://localhost:4173/');
  if (!['http:', 'https:'].includes(origin.protocol) || !origin.pathname.endsWith('/') || origin.search || origin.hash) {
    throw new Error('DOCS_SITE_URL must be an HTTP(S) URL ending in /, without a query or fragment.');
  }
  const indexable = process.env.DOCS_INDEXABLE === '1';
  if (indexable && (origin.protocol !== 'https:' || !process.env.DOCS_SITE_URL)) {
    throw new Error('An indexable build requires an explicit HTTPS DOCS_SITE_URL.');
  }
  return { id, sdk, sdkRoot, pkg, release, projectRoot, docs: path.join(projectRoot, 'docs'),
    content: path.join(root, 'sdks', id), origin, site: new URL(`${id}/`, origin), indexable };
}

export async function catalogue() {
  return Promise.all(ids.map(async (id) => ({ id, ...(await import(`../sdks/${id}/sdk.config.mjs`)).default })));
}
