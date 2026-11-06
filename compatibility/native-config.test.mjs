import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import vm from 'node:vm';
import { nativeMetroConfig } from './native-config/recipe.mjs';
import { catalogue } from '../scripts/context.mjs';
import { environmentFiles } from '../scripts/environments.mjs';

function configure(source, previous) {
  const module = { exports: {} };
  const require = name => {
    assert.equal(name, 'node:path');
    return path;
  };
  require.resolve = (name, options) => path.join(options.paths[0], 'node_modules', name);
  vm.runInNewContext(source, { module, require });
  const config = { resolver: { resolveRequest: previous } };
  assert.equal(module.exports(config, '/app'), config);
  return config.resolver.resolveRequest;
}

for (const id of ['bybit', 'binance']) {
  test(`${id} generated Expo and compatibility consumers use the same isolated Metro recipe`, async () => {
    const sdk = (await catalogue()).find(entry => entry.id === id);
    const files = await environmentFiles(id, sdk, 'expo');
    const source = await nativeMetroConfig(id);
    assert.equal(files.get('siebly-sdk.metro.cjs'), source);
    if (id === 'bybit') assert.doesNotMatch(source, /binance|node:path|browser-support/i);
    else assert.match(source, /binance\/lib\/util\/browser-support/);
    const delegated = [];
    const previous = (...args) => { delegated.push(args); return 'previous'; };
    const resolver = configure(source, previous);
    const context = { originModulePath: '/app/node_modules/binance/lib/util/requestUtils.js', resolveRequest: () => 'fallback' };
    for (const [name, dependency] of [['https', 'https-browserify'], ['http', 'stream-http'], ['url', 'url/']]) {
      const result = resolver(context, name, 'ios');
      assert.equal(result.type, 'sourceFile');
      assert.equal(result.filePath, path.join('/app/node_modules', dependency));
    }
    assert.equal(resolver(context, 'unrelated', 'android'), 'previous');
    assert.deepEqual(delegated[0], [context, 'unrelated', 'android']);
    for (const name of ['./node-support', './node-support.js']) {
      const result = resolver(context, name, 'ios');
      if (id === 'binance') assert.equal(result.filePath, '/app/node_modules/binance/lib/util/browser-support.js');
      else assert.equal(result, 'previous');
    }
    const fallback = configure(source);
    assert.equal(fallback(context, 'unrelated', 'ios'), 'fallback');
  });
}

test('SDKs without a polyfill recipe are rejected instead of receiving another exchange config', () => {
  assert.throws(() => nativeMetroConfig('hyperliquid'), /No Metro polyfill recipe/);
});
