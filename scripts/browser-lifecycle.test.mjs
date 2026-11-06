import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { EventEmitter } from 'node:events';
import ts from 'typescript';
import { catalogue } from './context.mjs';
import { environmentFiles } from './environments.mjs';

const tick = () => new Promise(resolve => setImmediate(resolve));
function eventTarget() {
  const events = new EventEmitter();
  return {
    addEventListener: (name, listener) => events.on(name, listener),
    removeEventListener: (name, listener) => events.off(name, listener),
    dispatch: (name, event = {}) => events.emit(name, event),
    count: name => events.listenerCount(name),
  };
}
function pending() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function commonjs(source) {
  return ts.transpileModule(source.replaceAll('import.meta.hot', 'hot'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

async function reactFixture(sdk) {
  const files = await environmentFiles(sdk.id, sdk, 'react');
  const window = eventTarget();
  const renders = [];
  let roots = 0, unmounts = 0, flushes = 0, disposed;
  const element = (type, props) => ({ type, props });
  const modules = {
    react: { StrictMode: 'StrictMode' },
    'react/jsx-runtime': { jsx: element, jsxs: element },
    'react-dom': { flushSync: callback => { flushes++; callback(); } },
    'react-dom/client': { createRoot: () => {
      roots++;
      return { render: tree => renders.push(tree.props.children.props.pageActive), unmount: () => { unmounts++; } };
    } },
    './App.jsx': { default: 'App' },
  };
  vm.runInNewContext(commonjs(files.get('main.jsx')), {
    exports: {}, require: name => modules[name], window,
    document: { getElementById: () => ({}) }, hot: { dispose: callback => { disposed = callback; } },
  });
  return { files, window, renders, dispose: () => disposed(), counts: () => ({ roots, unmounts, flushes }) };
}

for (const sdk of await catalogue()) {
  test(`${sdk.id} React pauses before caching and restores without replacing App's root`, async () => {
    const fixture = await reactFixture(sdk);
    assert.deepEqual(fixture.renders, [true]);
    fixture.window.dispatch('pageshow', { persisted: false });
    assert.deepEqual(fixture.renders, [true]);
    for (let cycle = 0; cycle < 2; cycle++) {
      fixture.window.dispatch('pagehide', { persisted: true });
      assert.equal(fixture.renders.at(-1), false);
      fixture.window.dispatch('pageshow', { persisted: true });
      assert.equal(fixture.renders.at(-1), true);
    }
    assert.deepEqual(fixture.counts(), { roots: 1, unmounts: 0, flushes: 2 });
    // App keeps its existing running state and gates only the price component.
    assert.match(fixture.files.get('App.jsx'), /running && pageActive \? <Prices \/>/);
    fixture.dispose();
    fixture.dispose();
    assert.equal(fixture.counts().unmounts, 1);
    for (const name of ['pageshow', 'pagehide']) assert.equal(fixture.window.count(name), 0);
    fixture.window.dispatch('pageshow', { persisted: true });
    assert.equal(fixture.renders.length, 5);
  });

  test(`${sdk.id} React disposes a discarded page without later resurrection`, async () => {
    const fixture = await reactFixture(sdk);
    fixture.window.dispatch('pagehide', { persisted: false });
    fixture.window.dispatch('pageshow', { persisted: true });
    assert.deepEqual(fixture.counts(), { roots: 1, unmounts: 1, flushes: 0 });
    assert.deepEqual(fixture.renders, [true]);
  });
}

async function viteFixture(sdk, { hideImmediately = false } = {}) {
  const files = await environmentFiles(sdk.id, sdk, 'vite');
  const window = eventTarget();
  const nodes = Object.fromEntries(['rest', 'live', 'error', 'stop'].map(id => [id, { textContent: '', ...eventTarget() }]));
  const clients = [], requests = [], timers = new Set();
  let disposed;
  class WebsocketClient extends EventEmitter {
    constructor() {
      super();
      this.pending = pending();
      this.closed = 0;
      this.subscriptions = 0;
      clients.push(this);
    }
    closeAll() { this.closed++; }
    subscribe() { this.subscriptions++; return this.pending.promise; }
    subscribeV5() { return [this.subscribe()]; }
    subscribeSpotSymbol24hrTicker() { return this.subscribe(); }
  }
  class RestClient {
    request() { const next = pending(); requests.push(next); return next.promise; }
    getAllMids() { return this.request(); }
    getTickers() { return this.request(); }
    getSymbolPriceTicker() { return this.request(); }
  }
  const source = files.get('main.js').replace(/^import .+;\n/m, '').replaceAll('import.meta.hot', 'hot');
  vm.runInNewContext(source, {
    window, document: { querySelector: selector => nodes[selector.slice(1)] },
    WebsocketClient, RestClient, RestClientV5: RestClient, MainClient: RestClient,
    setTimeout: callback => { timers.add(callback); return callback; }, clearTimeout: timer => timers.delete(timer),
    hot: { dispose: callback => { disposed = callback; } },
  });
  if (hideImmediately) window.dispatch('pagehide', { persisted: true });
  function update(client, price) {
    if (sdk.id === 'bybit') client.emit('update', { topic: 'tickers.BTCUSDT', data: { lastPrice: price } });
    else if (sdk.id === 'binance') client.emit('message', { e: '24hrTicker', c: price });
    else client.emit('message', { channel: 'allMids', data: { mids: { BTC: price } } });
  }
  function resolveRest(index, price) {
    const response = sdk.id === 'bybit' ? { retCode: 0, result: { list: [{ lastPrice: price }] } }
      : sdk.id === 'binance' ? { price } : { BTC: price };
    requests[index].resolve(response);
  }
  return { window, nodes, clients, timers, update, resolveRest, dispose: () => disposed() };
}

for (const sdk of await catalogue()) {
  test(`${sdk.id} Vite restores fresh clients and ignores stale updates and late setup`, async () => {
    const fixture = await viteFixture(sdk);
    await tick();
    const old = fixture.clients[0];
    fixture.window.dispatch('pagehide', { persisted: true });
    assert.equal(old.closed, 1);
    assert.equal(fixture.timers.size, 0);
    fixture.window.dispatch('pageshow', { persisted: true });
    fixture.window.dispatch('pageshow', { persisted: true });
    await tick();
    assert.equal(fixture.clients.length, 2);
    assert.equal(fixture.clients[1].subscriptions, 1);
    fixture.update(fixture.clients[1], '70000');
    fixture.update(old, '1');
    fixture.resolveRest(1, '70001');
    await tick();
    fixture.resolveRest(0, '2');
    old.pending.resolve();
    await tick();
    assert.equal(fixture.nodes.live.textContent, '70000');
    assert.equal(fixture.nodes.rest.textContent, '70001');
    assert.equal(old.closed, 2);
    assert.equal(fixture.clients[1].closed, 0);
    fixture.window.dispatch('pagehide', { persisted: true });
    fixture.window.dispatch('pageshow', { persisted: true });
    await tick();
    assert.equal(fixture.clients.length, 3);
    fixture.dispose();
    assert.equal(fixture.clients[2].closed, 1);
    assert.equal(fixture.timers.size, 0);
    for (const name of ['pageshow', 'pagehide']) assert.equal(fixture.window.count(name), 0);
    assert.equal(fixture.nodes.stop.count('click'), 0);
    fixture.window.dispatch('pageshow', { persisted: true });
    assert.equal(fixture.clients.length, 3);
  });

  test(`${sdk.id} Vite preserves an explicit Stop choice across history restoration`, async () => {
    const fixture = await viteFixture(sdk);
    await tick();
    fixture.nodes.stop.dispatch('click');
    fixture.nodes.stop.dispatch('click');
    fixture.window.dispatch('pagehide', { persisted: true });
    fixture.window.dispatch('pageshow', { persisted: true });
    await tick();
    assert.equal(fixture.clients.length, 1);
    assert.equal(fixture.clients[0].closed, 1);
    assert.equal(fixture.nodes.live.textContent, 'Stopped');
    fixture.dispose();
  });

  test(`${sdk.id} Vite skips setup cancelled before its microtask starts`, async () => {
    const fixture = await viteFixture(sdk, { hideImmediately: true });
    await tick();
    assert.equal(fixture.clients[0].subscriptions, 0);
    fixture.window.dispatch('pageshow', { persisted: false });
    assert.equal(fixture.clients.length, 1);
    fixture.window.dispatch('pageshow', { persisted: true });
    await tick();
    assert.equal(fixture.clients[1].subscriptions, 1);
    fixture.dispose();
  });
}
