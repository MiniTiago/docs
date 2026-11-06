import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import vm from 'node:vm';
import ts from 'typescript';

const base = { BYBIT_API_KEY: 'test-key', BYBIT_API_SECRET: 'test-secret',
  BYBIT_TESTNET_ORDERS: 'I_UNDERSTAND', BYBIT_TESTNET_STREAM: 'I_UNDERSTAND',
  BYBIT_LIMIT_PRICE: '990', BYBIT_ORDER_QTY: '0.01', BYBIT_MAX_NOTIONAL_USDT: '10' };
const ok = result => ({ retCode: 0, result });
const instrument = { symbol: 'BTCUSDT', status: 'Trading', contractType: 'LinearPerpetual',
  priceFilter: { tickSize: '0.1', minPrice: '0.1', maxPrice: '1000000' },
  lotSizeFilter: { qtyStep: '0.001', minOrderQty: '0.001', maxOrderQty: '100', minNotionalValue: '5' } };
const flush = async () => { for (let i = 0; i < 60; i++) await new Promise(setImmediate); };
async function run(file, options = {}) {
  const process = Object.assign(new EventEmitter(), { env: { ...base, ...options.env }, exitCode: 0 });
  const calls = [], logs = [], timers = new Map();
  let receipt = options.receipt, serial = 0, poll = 0, socket;
  class RestClientV5 {
    constructor(config, transport) { calls.push(['client', config, transport]); }
    async getInstrumentsInfo() { calls.push(['instruments']); return ok({ list: [options.instrument || instrument] }); }
    async getOrderbook() { return ok({ b: [['1000', '1']] }); }
    async submitOrder(order) {
      calls.push(['submit', order]);
      assert.ok(receipt, 'receipt must be persisted before submission');
      assert.ok(calls.some(c => c[0] === 'fsync'));
      if (options.submitThrows) throw new Error('MOCK_RAW_SECRET transport error');
      return { retCode: options.submitCode || 0, result: { orderId: 'exchange-id' } };
    }
    async getActiveOrders(query) {
      calls.push(['query', query]);
      if (options.queryThrows) throw new Error('MOCK_RAW_SECRET query error');
      const statuses = options.statuses || ['New', 'Cancelled'];
      const status = statuses[Math.min(poll++, statuses.length - 1)];
      return ok({ list: status ? [{ orderLinkId: query.orderLinkId, orderStatus: status,
        cumExecQty: options.filledQty || '0', leavesQty: status === 'New' ? '0.01' : '0' }] : [] });
    }
    async getHistoricOrders() { calls.push(['history']); return ok({ list: [] }); }
    async cancelOrder(query) {
      calls.push(['cancel', query]);
      if (options.cancelThrows) throw new Error('MOCK_RAW_SECRET cancellation error');
      return { retCode: options.cancelCode || 0, result: {} };
    }
  }
  class WebsocketClient extends EventEmitter {
    constructor(config, logger) { super(); socket = this; calls.push(['ws', config, logger]); }
    closeAll() { calls.push(['close']); this.emit('close', {}); }
    subscribeV5(topic, category) {
      calls.push(['subscribe', topic, category]);
      assert.ok(this.listenerCount('update') && this.listenerCount('authenticated') && this.listenerCount('response'));
      if (options.subscribeThrows) throw new Error('MOCK_RAW_SECRET');
      if (options.subscribeRejects) return [Promise.reject(new Error('MOCK_RAW_SECRET'))];
      if (!options.noAck) {
        this.emit('authenticated', {});
        this.emit('response', { op: 'subscribe', success: !options.badAck });
      }
      return [Promise.resolve()];
    }
  }
  const fs = {
    openSync() { if (receipt) throw new Error('EEXIST'); calls.push(['open']); return 1; },
    writeFileSync(fd, value) { receipt = value; calls.push(['save']); },
    fsyncSync() { calls.push(['fsync']); }, closeSync() { calls.push(['close-file']); },
    readFileSync() { return receipt; },
  };
  const source = readFileSync(new URL(`../sdks/bybit/examples/${file}.ts`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports: {}, process, BigInt,
    console: { log: (...args) => logs.push(args), error: (...args) => logs.push(args) },
    require(name) {
      if (name === 'bybit-api') return { RestClientV5, WebsocketClient };
      if (name === 'node:fs') return fs;
      if (name === 'node:crypto') return { randomUUID: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' };
      throw new Error(`Unexpected import ${name}`);
    },
    setTimeout(fn, delay) { const id = ++serial; if (file === 'first-order') queueMicrotask(fn); else timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  await flush();
  assert.ok(!JSON.stringify(logs).includes('MOCK_RAW_SECRET'), 'raw transport errors must stay private');
  return { process, calls, logs, timers, receipt, socket };
}
const count = (run, name) => run.calls.filter(c => c[0] === name).length;

test('order guards reject absent opt-in, credentials and invalid decimals before network calls', async () => {
  for (const env of [{ BYBITTRACE: '1' }, { BYBIT_TESTNET_ORDERS: '' }, { BYBIT_API_KEY: '' }, { BYBIT_ORDER_QTY: '1e-3' },
    { BYBIT_ORDER_QTY: '0' }, { BYBIT_MAX_NOTIONAL_USDT: '1' }, { BYBIT_ORDER_MODE: 'live' }]) {
    const r = await run('first-order', { env });
    assert.equal(count(r, 'instruments'), 0); assert.equal(count(r, 'submit'), 0); assert.equal(r.process.exitCode, 1);
  }
});
test('current tick, step, notional and below-bid validation prevent submission', async () => {
  for (const env of [{ BYBIT_LIMIT_PRICE: '990.01' }, { BYBIT_ORDER_QTY: '0.0011' },
    { BYBIT_ORDER_QTY: '0.001' }, { BYBIT_LIMIT_PRICE: '1000' }]) {
    const r = await run('first-order', { env }); assert.equal(count(r, 'submit'), 0); assert.equal(r.process.exitCode, 1);
  }
});
test('happy path persists ID and submits one Testnet post-only limit before confirmed cancel', async () => {
  const r = await run('first-order');
  assert.equal(r.process.exitCode, 0); assert.equal(count(r, 'submit'), 1); assert.equal(count(r, 'cancel'), 1);
  const order = r.calls.find(c => c[0] === 'submit')[1];
  assert.equal(order.orderType, 'Limit'); assert.equal(order.timeInForce, 'PostOnly'); assert.equal(order.positionIdx, 0);
  assert.equal(r.calls.find(c => c[0] === 'client')[1].testnet, true);
  assert.equal(JSON.parse(r.receipt).orderLinkId, order.orderLinkId);
  assert.equal(r.calls.find(c => c[0] === 'cancel')[1].orderLinkId, order.orderLinkId);
});
test('filled-before-cancel and rejected order states are terminal without cancellation', async () => {
  const filled = await run('first-order', { statuses: ['Filled'], filledQty: '0.01' });
  assert.equal(count(filled, 'cancel'), 0); assert.match(JSON.stringify(filled.logs), /A fill occurred/);
  const rejected = await run('first-order', { statuses: ['Rejected'], submitCode: 10001 });
  assert.equal(count(rejected, 'submit'), 1); assert.equal(count(rejected, 'cancel'), 0); assert.equal(rejected.process.exitCode, 1);
});
test('uncertain submission reconciles saved ID without retrying the write', async () => {
  const r = await run('first-order', { submitThrows: true });
  assert.equal(count(r, 'submit'), 1); assert.equal(count(r, 'cancel'), 1); assert.equal(r.process.exitCode, 0);
});
test('uncertain or rejected cancellation reconciles without retrying, including fill race', async () => {
  for (const options of [{ cancelThrows: true }, { cancelCode: 110001 },
    { cancelThrows: true, statuses: ['New', 'Filled'], filledQty: '0.01' }]) {
    const r = await run('first-order', options); assert.equal(count(r, 'cancel'), 1); assert.equal(r.process.exitCode, 0);
  }
});
test('unresolved reads and pending cancellation stop at ten polls', async () => {
  for (const options of [{ statuses: [null], submitThrows: true }, { statuses: ['New'], cancelThrows: true }, { queryThrows: true }]) {
    const r = await run('first-order', options); assert.equal(count(r, 'query'), 10);
    assert.equal(count(r, 'submit'), 1); assert.ok(count(r, 'cancel') <= 1); assert.equal(r.process.exitCode, 1);
  }
});
test('receipt blocks resubmission; recovery queries and cancels only saved order', async () => {
  const first = await run('first-order');
  const rerun = await run('first-order', { receipt: first.receipt }); assert.equal(count(rerun, 'submit'), 0);
  const recovery = await run('first-order', { receipt: first.receipt, env: { BYBIT_ORDER_MODE: 'recover' } });
  assert.equal(count(recovery, 'submit'), 0); assert.equal(count(recovery, 'instruments'), 0); assert.equal(count(recovery, 'cancel'), 1);
  const bad = await run('first-order', { receipt: '{}', env: { BYBIT_ORDER_MODE: 'recover' } });
  assert.equal(count(bad, 'query'), 0); assert.equal(bad.process.exitCode, 1);
});
test('private stream guards run before connection', async () => {
  for (const env of [{ BYBITTRACE: '1' }, { BYBIT_TESTNET_STREAM: '' }, { BYBIT_API_SECRET: '' }, { BYBIT_STREAM_SECONDS: '0' }]) {
    const r = await run('private-stream', { env }); assert.equal(count(r, 'ws'), 0); assert.equal(r.process.exitCode, 1);
  }
});
test('stream registers listeners first, logs safe fields and tears down on deadline', async () => {
  const r = await run('private-stream');
  r.socket.emit('update', { topic: 'order.linear', data: [{ orderId: 'id', orderStatus: 'New', secret: 'MOCK_RAW_SECRET' }] });
  assert.ok(!JSON.stringify(r.logs).includes('MOCK_RAW_SECRET'));
  assert.equal(r.calls.find(c => c[0] === 'ws')[1].testnet, true);
  assert.equal(r.timers.size, 1); [...r.timers.values()][0].fn();
  assert.equal(count(r, 'close'), 1); assert.equal(r.timers.size, 0); assert.equal(r.process.listenerCount('SIGINT'), 0);
});
test('stream rejects failures and closes once on signal, disconnect, exception or missing acknowledgement', async () => {
  for (const options of [{ badAck: true }, { subscribeRejects: true }, { subscribeThrows: true }, { noAck: true }]) {
    const r = await run('private-stream', options);
    if (options.noAck) [...r.timers.values()].find(t => t.delay === 10000).fn();
    assert.equal(count(r, 'close'), 1); assert.equal(r.process.exitCode, 1); assert.equal(r.timers.size, 0);
  }
  for (const event of ['reconnect', 'close', 'exception', 'SIGINT', 'SIGTERM']) {
    const r = await run('private-stream');
    (event.startsWith('SIG') ? r.process : r.socket).emit(event, {});
    assert.equal(count(r, 'close'), 1); assert.equal(r.timers.size, 0); assert.equal(r.process.listenerCount('SIGTERM'), 0);
  }
});
