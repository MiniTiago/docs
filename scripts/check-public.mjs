import { readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ids } from './context.mjs';
import { searchConsoleFile } from '../shared/site-services.mjs';

export async function checkPublic(directory) {
  const entries = await readdir(directory, { recursive: true });
  const allowedRoots = new Set([...ids, 'brand', 'index.html', '404.html', 'favicon.svg', 'portal.css', 'analytics.js', searchConsoleFile, 'robots.txt', 'sitemap.xml', 'build-manifest.json', '.nojekyll']);
  const allowedExtensions = new Set(['.html', '.js', '.css', '.json', '.xml', '.txt', '.svg', '.png', '.jpg', '.webp', '.woff', '.woff2', '.ico']);
  const privateDirectories = new Set(['node_modules', 'scripts', 'sdks', 'shared', 'compatibility', 'results', 'verification', 'tmp', 'src']);
  const allowedJson = new Set(['build-manifest.json', ...ids.map((id) => `${id}/hashmap.json`)]);
  let files = 0;
  for (const relative of entries) {
    const parts = relative.split(path.sep);
    if (!allowedRoots.has(parts[0]) || parts.some((part) => (part.startsWith('.') && part !== '.nojekyll') || privateDirectories.has(part))) throw new Error(`Private/unexpected output: ${relative}`);
    if (path.extname(relative) === '.json' && !allowedJson.has(parts.join('/'))) throw new Error(`Unexpected public JSON: ${relative}`);
    const filename = path.join(directory, relative);
    const stat = await lstat(filename);
    if (stat.isDirectory()) continue;
    if (!stat.isFile() || (relative !== '.nojekyll' && !allowedExtensions.has(path.extname(relative)))) throw new Error(`Unexpected public artifact: ${relative}`);
    if (['.html', '.js', '.json', '.css', '.xml', '.txt', '.svg'].includes(path.extname(relative))) {
      const content = await readFile(filename, 'utf8');
      if (/\/(?:Users|Volumes)\/|\/home\/runner\/work\/|file:\/\/|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/.test(content)) throw new Error(`Private path or credential in output: ${relative}`);
    }
    files++;
  }
  const manifest = JSON.parse(await readFile(path.join(directory, 'build-manifest.json'), 'utf8'));
  for (const id of ids) {
    if (!manifest.releases?.[id] || manifest.releases[id].version !== manifest.sdks[id]?.version) throw new Error(`Missing matching release provenance: ${id}`);
  }
  if (!entries.includes('.nojekyll')) throw new Error('Missing .nojekyll');
  console.log(`Verified ${files} generated public files; no authored Markdown, private builder, logs or local paths.`);
  return { files };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await checkPublic(path.resolve(process.argv[2] || 'dist'));
