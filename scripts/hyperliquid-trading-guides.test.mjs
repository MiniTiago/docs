import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { EventEmitter } from 'node:events';
import ts from 'typescript';

const owner = '0x' + '1'.repeat(40);
const agent = '0x' + '2'.repeat(40);
const cloid = '0x' + '3'.repeat(32);
const saved = { network: 'testnet', coin: 'BTC', accountAddress: owner, cloid };
const defaults = { HYPERLIQUID_ACCOUNT_ADDRESS: owner, HYPERLIQUID_PRIVATE_KEY: '0x' + '4'.repeat(64),
  HYPERLIQUID_ALLOW_TESTNET_ORDER: 'YES', HYPERLIQUID_ORDER_SIZE: '0.001',
  HYPERLIQUID_LIMIT_PRICE: '60000', HYPERLIQUID_MAX_NOTIONAL: '100' };
const source = await readFile(new URL('../sdks/hyperliquid/examples/first-order.ts', import.meta.url), 'utf8');
const streamSource = await readFile(new URL('../sdks/hyperliquid/examples/private-stream.ts', import.meta.url), 'utf8');
function compile(source) {
  return ts.transpileModule(source.replace('main().catch', 'globalThis.done = main().catch'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}
async function runOrder(action = 'place', options = {}) {
  const calls = [], logs = [];
  let written, synced = false;
  const state = options.state ?? { status: 'order', order: { order: { oid: 123 }, status: 'open' } };
  class Client {
    constructor(config, network) { calls.push(['constructor', config, network]); }
    async getUserRole(params) { calls.push(['role', params]); return options.role ?? { role: 'agent', data: { user: owner } }; }
    async getPerpMetadata() { calls.push(['metadata']); return { universe: [{ name: 'BTC', szDecimals: 5 }] }; }
    async getOrderBook() { calls.push(['book']); return { levels: [[{ px: '65000' }], []] }; }
    async submitLimitOrder(params) {
      assert.ok(synced, 'receipt must be flushed before submitting');
      calls.push(['submit', params]);
      if (options.submitFailure) throw { request: { key: 'do-not-log' } };
      return options.submitResult ?? { status: 'ok', response: { data: { statuses: [{ resting: { oid: 123 } }] } } };
    }
    async getOrderStatus(params) { calls.push(['status', params]); return state; }
    async cancelOrdersByClientOrderId(params) {
      calls.push(['cancel', params]);
      if (options.cancelFailure) throw { secret: 'do-not-log' };
      return options.cancelResult ?? { status: 'ok', response: { data: { statuses: ['success'] } } };
    }
  }
  const sandbox = { exports: {}, process: { argv: ['node', 'orders.mts', action], env: { ...defaults, ...options.env } },
    console: { log: (...v) => logs.push(v), error: (...v) => logs.push(v) },
    require(name) {
      if (name === '@siebly/hyperliquid-api') return { RestClient: Client };
      if (name === 'ethers') return { Wallet: class { address = options.signerAddress ?? agent; } };
      if (name === 'node:crypto') return { randomBytes: () => ({ toString: () => '3'.repeat(32) }) };
      assert.equal(name, 'node:fs/promises');
      return { readFile: async () => JSON.stringify(options.receipt ?? saved), open: async (file, flags, mode) => {
        assert.equal(flags, 'wx'); assert.equal(mode, 0o600);
        if (options.exists) throw new Error('EEXIST');
        return { writeFile: async value => { written = JSON.parse(value); }, sync: async () => { synced = true; }, close: async () => {} };
      } };
    } };
  vm.runInNewContext(compile(source), sandbox);
  await sandbox.done;
  return { calls, logs, written, exitCode: sandbox.process.exitCode };
}

test('Hyperliquid write opt-in and credentials fail before client construction', async () => {
  for (const env of [{ HYPERLIQUID_ALLOW_TESTNET_ORDER: '' }, { HYPERLIQUID_PRIVATE_KEY: '' }, { HYPERLIQUID_ACCOUNT_ADDRESS: 'bad' }]) {
    const r = await runOrder('place', { env }); assert.equal(r.exitCode, 1); assert.equal(r.calls.length, 0);
  }
});
test('Hyperliquid requires an API wallet authorized for the managed account', async () => {
  for (const options of [{ role: { role: 'user' } }, { role: { role: 'agent', data: { user: agent } } }, { signerAddress: owner }]) {
    const r = await runOrder('place', options); assert.equal(r.exitCode, 1); assert.equal(r.calls.some(c => c[0] === 'submit'), false);
  }
});
test('Hyperliquid validates size, price precision, cap and below-bid price without rounding', async () => {
  for (const env of [{ HYPERLIQUID_ORDER_SIZE: '0.000001' }, { HYPERLIQUID_LIMIT_PRICE: '60000.1' },
    { HYPERLIQUID_LIMIT_PRICE: '65000' }, { HYPERLIQUID_MAX_NOTIONAL: '1' }, { HYPERLIQUID_LIMIT_PRICE: '6e4' }]) {
    const r = await runOrder('place', { env }); assert.equal(r.exitCode, 1); assert.equal(r.calls.some(c => c[0] === 'submit'), false);
  }
});
test('Hyperliquid saves durable Testnet identifiers before one post-only submission', async () => {
  const r = await runOrder(); assert.equal(r.exitCode, undefined);
  assert.equal(r.written.cloid, cloid); assert.equal(r.written.network, 'testnet');
  const submit = r.calls.find(c => c[0] === 'submit')[1];
  assert.equal(submit.postOnly, true); assert.equal(submit.price, '60000'); assert.equal(submit.size, '0.001');
  assert.equal(submit.clientOrderId, r.written.cloid); assert.equal(r.calls[0][1].testnet, true);
  const existing = await runOrder('place', { exists: true }); assert.equal(existing.calls.some(c => c[0] === 'submit'), false);
});
test('Hyperliquid rejected or uncertain submissions retain receipt and never retry', async () => {
  for (const options of [{ submitFailure: true }, { submitResult: { status: 'err', response: 'bad' } },
    { submitResult: { status: 'ok', response: { data: { statuses: [{ error: 'bad' }] } } } }]) {
    const r = await runOrder('place', options); assert.equal(r.exitCode, 1); assert.ok(r.written);
    assert.equal(r.calls.filter(c => c[0] === 'submit').length, 1); assert.doesNotMatch(JSON.stringify(r.logs), /do-not-log/);
  }
});
test('Hyperliquid status is read-only; cancellation queries before a single write', async () => {
  const status = await runOrder('status', { env: { HYPERLIQUID_PRIVATE_KEY: '', HYPERLIQUID_ALLOW_TESTNET_ORDER: '' } });
  assert.equal(status.exitCode, undefined); assert.equal(status.calls[0][1].privateKey, undefined);
  assert.deepEqual(status.calls.map(c => c[0]), ['constructor', 'status']);
  const cancel = await runOrder('cancel'); assert.equal(cancel.exitCode, undefined);
  assert.deepEqual(cancel.calls.map(c => c[0]), ['constructor', 'role', 'status', 'cancel']);
  assert.equal(cancel.calls.at(-1)[1].cancels[0].cloid, cloid);
  for (const state of [{ status: 'unknownOid' }, { status: 'order', order: { order: { oid: 123 }, status: 'filled' } }]) {
    const r = await runOrder('cancel', { state }); assert.equal(r.calls.some(c => c[0] === 'cancel'), false);
  }
  for (const options of [{ cancelFailure: true }, { cancelResult: { status: 'ok', response: { data: { statuses: [{ error: 'already filled' }] } } } }]) {
    const r = await runOrder('cancel', options); assert.equal(r.exitCode, 1); assert.equal(r.calls.filter(c => c[0] === 'cancel').length, 1);
  }
  const mismatch = await runOrder('status', { receipt: { ...saved, accountAddress: agent } });
  assert.equal(mismatch.exitCode, 1); assert.equal(mismatch.calls.some(c => c[0] === 'status'), false);
});

async function runStream(options = {}) {
  const process = new EventEmitter(); process.env = { HYPERLIQUID_ACCOUNT_ADDRESS: owner, ...options.env };
  const logs = [], timers = new Map(); let ws, finish;
  class Client extends EventEmitter {
    constructor(config) { super(); assert.equal(config.testnet, true); ws = this; this.closes = 0; }
    closeAll() { this.closes++; }
    async subscribe(topics) {
      assert.equal(this.listenerCount('message'), 1); assert.equal(this.listenerCount('exception'), 1);
      assert.equal(topics[0].type, 'orderUpdates'); assert.equal(topics[1].type, 'userFills');
      assert.equal(topics[0].user, owner);
      if (options.pending) await new Promise(resolve => { finish = resolve; });
      if (options.reject) throw new Error('do-not-log');
    }
  }
  const sandbox = { exports: {}, process, console: { log: (...v) => logs.push(v), error: (...v) => logs.push(v) },
    setTimeout: fn => { timers.set(1, fn); return 1; }, clearTimeout: id => timers.delete(id),
    require: () => ({ WebsocketClient: Client }) };
  vm.runInNewContext(compile(streamSource), sandbox);
  if (!options.pending) await sandbox.done;
  return { process, logs, timers, get ws() { return ws; }, finish: async () => { finish?.(); await sandbox.done; } };
}
test('Hyperliquid account stream narrows events, skips fill snapshots and closes on deadline', async () => {
  const r = await runStream();
  for (const type of ['orderUpdates', 'userFills']) r.ws.emit('response', { channel: 'subscriptionResponse', data: { method: 'subscribe', subscription: { type, user: owner } } });
  assert.equal(r.logs[0][0], 'Subscribed to order updates and fills.');
  r.ws.emit('message', { channel: 'orderUpdates', data: [{ order: { oid: 1, coin: 'BTC' }, status: 'open' }] });
  r.ws.emit('message', { channel: 'userFills', data: { isSnapshot: true, fills: [{ oid: 2 }] } });
  assert.equal(r.logs.filter(v => v[0] === 'Fill:').length, 0);
  r.ws.emit('message', { channel: 'userFills', data: { fills: [{ oid: 2, coin: 'BTC', px: '60000', sz: '0.001' }] } });
  assert.equal(r.logs.filter(v => v[0] === 'Fill:').length, 1);
  r.timers.get(1)(); assert.equal(r.ws.closes, 1); assert.equal(r.process.exitCode, undefined); assert.equal(r.process.listenerCount('SIGINT'), 0);
});
test('Hyperliquid stream guards and interrupted setup leave no active client', async () => {
  const invalid = await runStream({ env: { HYPERLIQUID_ACCOUNT_ADDRESS: 'bad' } }); assert.equal(invalid.ws, undefined);
  for (const event of ['exception', 'reconnecting']) {
    const r = await runStream(); r.ws.emit(event, { secret: 'do-not-log' }); assert.equal(r.ws.closes, 1);
    assert.equal(r.process.exitCode, 1); assert.doesNotMatch(JSON.stringify(r.logs), /do-not-log/);
  }
  const signal = await runStream(); signal.process.emit('SIGINT'); assert.equal(signal.ws.closes, 1);
  const unconfirmed = await runStream(); unconfirmed.timers.get(1)(); assert.equal(unconfirmed.process.exitCode, 1);
  const rejected = await runStream({ reject: true }); assert.ok(rejected.ws.closes >= 1); assert.equal(rejected.process.exitCode, 1);
  const pending = await runStream({ pending: true }); pending.process.emit('SIGTERM'); await pending.finish(); assert.equal(pending.ws.closes, 2);
});
