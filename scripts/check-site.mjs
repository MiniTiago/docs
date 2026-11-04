import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const decode = (s) => s.replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"');
export async function checkSite(root) {
  const manifest = JSON.parse(await readFile(path.join(root, 'build-manifest.json'), 'utf8'));
  const base = new URL(manifest.siteUrl);
  const files = new Set(await readdir(root, { recursive: true }));
  const pages = new Map();
  for (const file of files) if (file.endsWith('.html')) {
    const html = await readFile(path.join(root, file), 'utf8');
    pages.set(file, { html, ids: new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => decode(m[1]))) });
  }
  const errors = new Set();
  let links = 0, assets = 0;
  function destination(raw, file, anchor = false) {
    if (/^(mailto:|tel:|data:|javascript:)/.test(raw)) return;
    const target = new URL(decode(raw), new URL(file, base));
    if (target.origin !== base.origin) return;
    if (!target.pathname.startsWith(base.pathname)) { errors.add(`${file}: URL escaped base: ${raw}`); return; }
    const relative = decodeURIComponent(target.pathname.slice(base.pathname.length));
    // Deliberately no extensionless fallback: test the paths GitHub Pages receives.
    const name = relative.endsWith('/') || !relative ? `${relative}index.html` : relative;
    if (!files.has(name)) { errors.add(`${file}: missing file ${raw}`); return; }
    if (anchor && target.hash && pages.has(name) && !pages.get(name).ids.has(decodeURIComponent(target.hash.slice(1)))) errors.add(`${file}: missing anchor ${raw}`);
  }
  for (const [file, { html }] of pages) {
    const notFound = file.endsWith('404.html');
    if (!/<title>[^<]+<\/title>/.test(html)) errors.add(`${file}: missing title`);
    if (!notFound && !/<h1[\s>]/.test(html)) errors.add(`${file}: no static heading`);
    if (/\/Volumes\/Repositories\/|\/Users\/ts\//.test(html)) errors.add(`${file}: local path leaked`);
    if (!notFound) {
      if (!/<meta name="description" content="[^"]+"/.test(html)) errors.add(`${file}: missing description`);
      if (!manifest.indexable && !html.includes('noindex,nofollow')) errors.add(`${file}: missing preview noindex`);
      if (manifest.indexable) {
        const url = new URL(file.replace(/(^|\/)index\.html$/, '$1'), base).href;
        if (!html.includes(`rel="canonical" href="${url}"`)) errors.add(`${file}: incorrect canonical`);
        if (!html.includes('application/ld+json')) errors.add(`${file}: missing structured data`);
      }
    }
    for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) { links++; destination(href, file, true); }
    for (const [, asset] of html.matchAll(/<(?:script|img)\b[^>]*\bsrc="([^"]+)"/g)) { assets++; destination(asset, file); }
    for (const [, tag] of html.matchAll(/(<link\b[^>]+>)/g)) {
      const rel = /\brel=["']([^"']+)["']/.exec(tag)?.[1].toLowerCase().split(/\s+/) || [];
      if (rel.some((token) => ['stylesheet', 'icon', 'modulepreload', 'preload'].includes(token))) {
        const href = /\bhref=["']([^"']+)["']/.exec(tag)?.[1];
        if (href) { assets++; destination(href, file); }
      }
    }
  }
  if (manifest.indexable) {
    const xml = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
    const count = [...pages.keys()].filter((p) => !p.endsWith('404.html')).length;
    if (urls.length !== count || new Set(urls).size !== count) errors.add('Sitemap must list every content page exactly once.');
    for (const url of urls) destination(url, 'sitemap.xml');
  }
  if (errors.size) throw new Error([...errors].slice(0, 30).join('\n') + `\n${errors.size} site validation failure(s)`);
  const result = { pages: pages.size, links, assets, sdkCount: Object.keys(manifest.sdks).length, indexable: manifest.indexable, siteUrl: manifest.siteUrl };
  console.log(`Verified ${result.pages} HTML pages, ${links} links and ${assets} asset references across ${result.sdkCount} SDKs.`);
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await checkSite(path.resolve(process.argv[2] || 'dist'));
