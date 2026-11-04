import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { root } from './context.mjs';
import { checkSite } from './check-site.mjs';
import { searchConsoleFile } from '../shared/site-services.mjs';

test('asset checks handle multiple rel tokens and either HTML quote style', async () => {
  const scratch = path.join(root, 'tmp');
  await mkdir(scratch, { recursive: true });
  const directory = await mkdtemp(path.join(scratch, 'site-check-'));
  try {
    await writeFile(path.join(directory, 'build-manifest.json'), JSON.stringify({ siteUrl: 'http://localhost:4173/', indexable: false, sdks: {} }));
    const page = (links) => `<html><head><title>Check</title><meta name="description" content="Test"><meta name="robots" content="noindex,nofollow">${links}</head><body><h1>Check</h1></body></html>`;
    await writeFile(path.join(directory, 'index.html'), page(`<link rel='preload stylesheet' href='missing.css'>`));
    await assert.rejects(checkSite(directory), /missing file missing.css/);
    await writeFile(path.join(directory, 'style.css'), 'body { color: black; }');
    await writeFile(path.join(directory, 'index.html'), page(`<link rel='preload stylesheet' href='style.css'><link rel="STYLESHEET preload" href="style.css">`));
    const result = await checkSite(directory);
    assert.equal(result.assets, 2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Search Console verification stays exact and is excluded from page metadata and sitemap counts', async () => {
  const scratch = path.join(root, 'tmp');
  await mkdir(scratch, { recursive: true });
  const directory = await mkdtemp(path.join(scratch, 'verification-check-'));
  try {
    const siteUrl = 'https://sieblyio.github.io/docs/';
    await writeFile(path.join(directory, 'build-manifest.json'), JSON.stringify({ siteUrl, indexable: true, sdks: {} }));
    await writeFile(path.join(directory, 'index.html'), `<html><head><title>Docs</title><meta name="description" content="SDK docs"><link rel="canonical" href="${siteUrl}"><script type="application/ld+json">{}</script></head><body><h1>Docs</h1></body></html>`);
    await writeFile(path.join(directory, 'sitemap.xml'), `<urlset><url><loc>${siteUrl}</loc></url></urlset>`);
    const filename = path.join(directory, searchConsoleFile);
    await writeFile(filename, `google-site-verification: ${searchConsoleFile}`);
    assert.equal((await checkSite(directory)).pages, 1);
    await writeFile(filename, 'incorrect verification');
    await assert.rejects(checkSite(directory), /Incorrect Search Console/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
