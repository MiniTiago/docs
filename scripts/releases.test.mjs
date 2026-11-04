import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateRelease, verifyIntegrity, validateArchiveEntries } from './releases.mjs';
const sdk = { packageName: 'bybit-api', repository: 'https://github.com/sieblyio/bybit-api' };
const metadata = { name: sdk.packageName, version: '4.8.4', repository: { url: 'git+https://github.com/sieblyio/bybit-api.git' }, gitHead: 'a'.repeat(40), dist: { tarball: 'https://registry.npmjs.org/bybit-api/-/bybit-api-4.8.4.tgz', integrity: 'sha512-' + Buffer.alloc(64).toString('base64') } };
test('release selection accepts exact stable npm identity and rejects mismatches', () => {
  assert.equal(validateRelease(sdk, metadata).version, '4.8.4');
  for (const replacement of [{ name: 'other' }, { version: '4.9.0-beta.1' }, { repository: 'https://github.com/other/repo' }, { gitHead: 'latest' }, { dist: { ...metadata.dist, tarball: 'https://evil.example/pkg.tgz' } }, { dist: { ...metadata.dist, integrity: null } }]) assert.throws(() => validateRelease(sdk, { ...metadata, ...replacement }));
});
test('npm integrity rejects changed archive bytes', () => {
  const bytes = Buffer.from('actual archive bytes');
  const integrity = 'sha512-' + createHash('sha512').update(bytes).digest('base64');
  verifyIntegrity(bytes, integrity);
  assert.throws(() => verifyIntegrity(Buffer.from('changed bytes'), integrity), /integrity mismatch/);
});
test('archives reject traversal, absolute paths, multiple roots and links before extraction', () => {
  validateArchiveEntries([{ path: 'package/', type: 'Directory' }, { path: 'package/src/index.ts', type: 'File' }]);
  for (const entry of [{ path: 'package/../escape', type: 'File' }, { path: '/absolute', type: 'File' }, { path: 'package/link', type: 'SymbolicLink' }, { path: 'package/link', type: 'Link' }, { path: 'other/file', type: 'File' }]) assert.throws(() => validateArchiveEntries([{ path: 'package/index.ts', type: 'File' }, entry]));
});
