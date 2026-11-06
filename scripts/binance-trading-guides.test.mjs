import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import vm from 'node:vm';
import ts from 'typescript';

const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
const receipt = { environment: 'spot-testnet', symbol: 'BTCUSDT', clientOrderId: `docs_${'a'.repeat(27)}` };
const baseEnv = { BINANCE_TESTNET: 'true', BINANCE_TESTNET_API_KEY: 'secret-key', BINANCE_TESTNET_API_SECRET: 'secret-value', BINANCE_ORDER_RECEIPT: 'receipt.json', BINANCE_SYMBOL: 'BTCUSDT', BINANCE_SIDE: 'BUY', BINANCE_PRICE: '100.00', BINANCE_QUANTITY: '0.100' };
const instrument = { symbol: 'BTCUSDT', status: 'TRADING', isSpotTradingAllowed: true, orderTypes: ['LIMIT_MAKER'], filters: [
  { filterType: 'PRICE_FILTER', minPrice: '0.01', maxPrice: '1000000', tickSize: '0.01' },
  { filterType: 'LOT_SIZE', minQty: '0.001', maxQty: '100', stepSize: '0.001' },
  { filterType: 'MIN_NOTIONAL', minNotional: '5' },
] };
async function run(file, options = {}) {
  const calls = [], logs = [], timers = new Map();
  const process = Object.assign(new EventEmitter(), { env: { ...baseEnv, ...options.env }, argv: ['node', file, options.command ?? 'place'], exitCode: undefined });
  let saved = options.saved, reads = 0, ws;
  class MainClient {
    constructor(config) { calls.push(['client', config]); }
    generateNewOrderId() { return receipt.clientOrderId; }
    async getExchangeInfo() { calls.push(['filters']); return { symbols: [instrument] }; }
    async submitNewOrder(order) { assert.ok(saved, 'persist before submission'); calls.push(['place', order]); if (options.placeError) throw options.placeError; }
    async getOrder() { calls.push(['status']); if (options.readError) throw options.readError; return { symbol: 'BTCUSDT', status: options.statuses?.[reads++] ?? 'NEW', executedQty: '0' }; }
    async cancelOrder() { calls.push(['cancel']); if (options.cancelError) throw options.cancelError; }
  }
  class WebsocketAPIClient {
    constructor(config, logger) { calls.push(['ws', config]); ws = new EventEmitter(); logger.error('secret-value'); }
    getWSClient() { return ws; }
    async subscribeUserDataStream(key) {
      assert.equal(ws.listenerCount('message'), 1); assert.equal(ws.listenerCount('exception'), 1);
      calls.push(['subscribe', key]);
      if (options.subscribeError) throw options.subscribeError;
      if (options.pending) await options.pending;
    }
    async disconnectAll() { calls.push(['close']); }
  }
  const source = readFileSync(new URL(`../sdks/binance/examples/${file}.ts`, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(js, {
    exports: {}, process, console: { log: (...args) => logs.push(args), error: (...args) => logs.push(args) },
    setTimeout: (fn, ms) => { if (ms === 1000) { queueMicrotask(fn); return 0; } const id = timers.size + 1; timers.set(id, fn); return id; },
    clearTimeout: id => timers.delete(id),
    require: name => ({ binance: { MainClient, WebsocketAPIClient, WS_KEY_MAP: { mainWSAPI: 'mainWSAPI' } },
      'node:crypto': { randomUUID: () => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
      'node:fs': { readFileSync: () => JSON.stringify(saved), writeFileSync: (path, data, config) => { assert.equal(config.flag, 'wx'); if (saved) throw Error('exists'); saved = JSON.parse(data); } },
    })[name],
  });
  await flush();
  assert.ok(!JSON.stringify(logs).includes('secret-'));
  return { calls, logs, process, timers, ws, saved };
}
const count = (result, name) => result.calls.filter(call => call[0] === name).length;

test('Testnet opt-in and credentials fail before constructing either client', async () => {
  for (const file of ['first-order', 'private-stream']) for (const env of [{ BINANCE_TESTNET: 'false' }, { BINANCE_TESTNET_API_SECRET: '' }]) {
    const result = await run(file, { env }); assert.equal(result.calls.length, 0); assert.equal(result.process.exitCode, 1);
  }
});
test('places decimal strings once, persists identifier, then queries', async () => {
  const result = await run('first-order');
  assert.equal(count(result, 'place'), 1); assert.equal(count(result, 'status'), 1);
  assert.equal(result.calls.find(call => call[0] === 'client')[1].testnet, true);
  const order = result.calls.find(call => call[0] === 'place')[1];
  assert.equal(order.price, '100.00'); assert.equal(order.quantity, '0.100'); assert.equal(order.type, 'LIMIT_MAKER');
  assert.equal(order.newClientOrderId, result.saved.clientOrderId);
});
test('existing receipt, invalid precision and filters prevent writes', async () => {
  for (const options of [{ saved: receipt }, { env: { BINANCE_PRICE: '100.001' } }, { env: { BINANCE_QUANTITY: '0.0001' } }, { env: { BINANCE_QUANTITY: '0.001' } }, { env: { BINANCE_PRICE: '1e2' } }]) {
    const result = await run('first-order', options); assert.equal(count(result, 'place'), 0); assert.equal(result.process.exitCode, 1);
  }
});
test('rejected and uncertain submission retain receipt without retries', async () => {
  for (const placeError of [{ code: -2010 }, Error('timeout secret-key')]) {
    const result = await run('first-order', { placeError }); assert.ok(result.saved); assert.equal(count(result, 'place'), 1); assert.equal(count(result, 'cancel'), 0); assert.equal(result.process.exitCode, 1);
  }
});
test('status uses saved identifier and bounds failed reads', async () => {
  const result = await run('first-order', { command: 'status', saved: receipt, readError: Error('unknown order') });
  assert.equal(count(result, 'status'), 3); assert.equal(count(result, 'place'), 0); assert.equal(result.process.exitCode, 1);
});
test('cancel checks first and observes canceled or filled race without retry', async () => {
  for (const status of ['CANCELED', 'FILLED']) {
    const result = await run('first-order', { command: 'cancel', saved: receipt, statuses: ['PARTIALLY_FILLED', status], cancelError: status === 'FILLED' ? Error('race') : undefined });
    assert.equal(count(result, 'cancel'), 1); assert.equal(count(result, 'status'), 2); assert.equal(result.process.exitCode, undefined);
  }
  const filled = await run('first-order', { command: 'cancel', saved: receipt, statuses: ['FILLED'] }); assert.equal(count(filled, 'cancel'), 0);
});
test('uncertain cancel remains bounded and reports unresolved status', async () => {
  const result = await run('first-order', { command: 'cancel', saved: receipt, cancelError: Error('timeout') });
  assert.equal(count(result, 'cancel'), 1); assert.equal(count(result, 'status'), 4); assert.equal(result.process.exitCode, 1);
});
test('stream handles unwrapped execution events and finite teardown', async () => {
  const result = await run('private-stream');
  result.ws.emit('message', { e: 'executionReport', s: 'BTCUSDT', c: receipt.clientOrderId, x: 'TRADE', X: 'FILLED', l: '0.1', z: '0.1', secret: 'secret-value' });
  assert.ok(JSON.stringify(result.logs).includes('FILLED')); assert.ok(!JSON.stringify(result.logs).includes('secret-value'));
  assert.equal(result.calls[0][1].testnet, true); assert.equal(result.calls[0][1].resubscribeUserDataStreamAfterReconnect, false);
  [...result.timers.values()][0](); await flush();
  assert.equal(count(result, 'close'), 1); assert.equal(result.timers.size, 0); assert.equal(result.process.listenerCount('SIGINT'), 0);
});
test('stream stops on signals, reconnect, exception and subscribe failure', async () => {
  for (const event of ['SIGINT', 'SIGTERM', 'reconnecting', 'exception']) {
    const result = await run('private-stream');
    (event.startsWith('SIG') ? result.process : result.ws).emit(event);
    await flush(); assert.equal(count(result, 'close'), 1); assert.equal(result.timers.size, 0);
  }
  const failed = await run('private-stream', { subscribeError: Error('secret-value') });
  assert.equal(count(failed, 'close'), 1); assert.equal(failed.process.exitCode, 1); assert.equal(failed.timers.size, 0);
});
test('late subscribe completion cannot leave a timed-out connection open', async () => {
  let resolve; const pending = new Promise(done => { resolve = done; });
  const result = await run('private-stream', { pending });
  [...result.timers.values()][0](); await flush(); resolve(); await flush();
  assert.equal(count(result, 'close'), 2); assert.equal(result.timers.size, 0);
});
