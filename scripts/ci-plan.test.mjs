import test from 'node:test';
import assert from 'node:assert/strict';
import { planBuild, readPublishedManifest, publishedManifestUrl } from './ci-plan.mjs';

const releases = { bybit: { version: '4.8.4' } };
const revision = 'a'.repeat(40);
const current = { documentationRevision: revision, releases: { bybit: { version: '4.8.4' } } };
const main = { repository: 'sieblyio/docs', ref: 'refs/heads/main', revision };

test('scheduled checks compare versions from the live Pages manifest', async () => {
  assert.equal(publishedManifestUrl, 'https://sieblyio.github.io/docs/build-manifest.json');
  const manifest = await readPublishedManifest(async (url, options) => {
    assert.equal(url, publishedManifestUrl);
    assert.equal(options.cache, 'no-store');
    return { ok: true, json: async () => current };
  });
  assert.deepEqual(planBuild({ ...main, eventName: 'schedule' }, releases, manifest), { build: false, deploy: false });
  assert.deepEqual(planBuild({ ...main, eventName: 'schedule' }, releases, { ...current, releases: { bybit: { version: '4.8.3' } } }), { build: true, deploy: true });
});

test('a pending or absent documentation revision rebuilds unchanged SDK versions', () => {
  for (const manifest of [
    { ...current, documentationRevision: 'b'.repeat(40) },
    { releases: current.releases },
  ]) assert.deepEqual(planBuild({ ...main, eventName: 'schedule' }, releases, manifest), { build: true, deploy: true });
  assert.deepEqual(planBuild({ ...main, eventName: 'schedule', revision: undefined }, releases, current), { build: true, deploy: true });
});

test('an absent initial manifest builds, while an unavailable site fails the scheduled check', async () => {
  const manifest = await readPublishedManifest(async () => ({ ok: false, status: 404 }));
  assert.deepEqual(planBuild({ ...main, eventName: 'schedule' }, releases, manifest), { build: true, deploy: true });
  await assert.rejects(readPublishedManifest(async () => ({ ok: false, status: 503 })), /Cannot read published manifest: 503/);
});

test('shared changes and manual runs build all SDKs regardless of published versions', () => {
  for (const eventName of ['push', 'workflow_dispatch']) assert.deepEqual(planBuild({ ...main, eventName }, releases, current), { build: true, deploy: true });
});

test('pull requests, forks, tags and non-main refs never receive a deploy plan', () => {
  for (const context of [
    { ...main, eventName: 'pull_request' },
    { ...main, eventName: 'pull_request_target' },
    { ...main, eventName: 'push', repository: 'someone/docs' },
    { ...main, eventName: 'workflow_dispatch', ref: 'refs/heads/feature' },
    { ...main, eventName: 'workflow_dispatch', ref: 'refs/tags/release' },
  ]) assert.deepEqual(planBuild(context, releases, current), { build: true, deploy: false });
});
