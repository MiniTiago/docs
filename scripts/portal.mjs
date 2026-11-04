import { cp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { root, ids } from './context.mjs';

const escape = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
export async function assemblePortal(out, manifest) {
  await cp(path.join(root, 'shared/public'), out, { recursive: true });
  await cp(path.join(root, 'shared/portal.css'), path.join(out, 'portal.css'));
  const site = new URL(manifest.siteUrl);
  const cards = ids.filter((id) => manifest.sdks[id]).map((id) => {
    const sdk = manifest.sdks[id];
    return `<a class="sdk-card" href="${site.pathname}${id}/"><div class="card-top"><span class="sdk-icon">${sdk.name[0]}</span><span class="version">v${escape(sdk.version)}</span></div><h2>${escape(sdk.name)}</h2><code>${escape(sdk.packageName)}</code><p>Quickstart, usage guides and API reference.</p><span class="card-link">Read documentation <span aria-hidden="true">→</span></span></a>`;
  }).join('\n');
  const sdkNames = ids.filter((id) => manifest.sdks[id]).map((id) => manifest.sdks[id].name).join(', ');
  const seo = manifest.indexable ? `<link rel="canonical" href="${escape(site.href)}"><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Siebly SDK documentation', url: site.href })}</script>` : '';
  await writeFile(path.join(out, 'index.html'), `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>JavaScript and TypeScript SDK documentation | Siebly</title><meta name="description" content="Documentation for Siebly's ${escape(sdkNames)} SDKs. Install a package, make your first request and explore the API reference."><meta name="robots" content="${manifest.indexable ? 'index,follow' : 'noindex,nofollow'}">${seo}<link rel="icon" href="${site.pathname}favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${site.pathname}portal.css"></head><body><header><a href="${site.pathname}" aria-label="Siebly documentation home"><picture><source media="(prefers-color-scheme: dark)" srcset="${site.pathname}brand/siebly-wordmark-dark.svg"><img src="${site.pathname}brand/siebly-wordmark-light.svg" alt="Siebly" width="98" height="28"></picture></a><nav><a href="https://siebly.io/">Siebly.io ↗</a><a href="https://github.com/sieblyio">GitHub ↗</a></nav></header><main><p class="eyebrow">DEVELOPER DOCUMENTATION</p><h1>JavaScript &amp; TypeScript SDKs</h1><p class="intro">Connect to exchange REST APIs and WebSockets.<br>Choose your SDK to get started.</p><div class="sdk-grid">${cards}</div><section><h2>Build with confidence</h2><p>Start with a public market-data request, follow practical integration guides, and look up the types and methods for your SDK.</p><div class="resources"><a href="https://siebly.io/examples">Browse examples ↗</a><a href="https://siebly.io/support">Get support ↗</a></div></section></main><footer>Built by Siebly. Open source SDKs for exchange APIs.</footer></body></html>`);
  await writeFile(path.join(out, '404.html'), `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Page not found | Siebly Docs</title><link rel="stylesheet" href="${site.pathname}portal.css"></head><body><main><h1>Page not found</h1><p>Choose an SDK to find its guides and API reference.</p><a href="${site.pathname}">All SDK documentation</a></main></body></html>`);
  await writeFile(path.join(out, '.nojekyll'), '');
  if (manifest.indexable) {
    const locations = [site.href];
    for (const id of ids) {
      const sitemap = await readFile(path.join(out, id, 'sitemap.xml'), 'utf8');
      locations.push(...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    }
    await writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locations.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`);
  }
  await writeFile(path.join(out, 'robots.txt'), manifest.indexable ? `User-agent: *\nAllow: /\nSitemap: ${site.href}sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
}
