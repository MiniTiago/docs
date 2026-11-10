import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ids, root } from './context.mjs';

const read = (file) => readFile(path.join(root, file), 'utf8');

test('every SDK has a discoverable proxy guide with checked REST and socket examples', async () => {
  assert.match(await read('shared/config.mjs'), /text: 'Proxies', link: '\/guides\/proxies'/);

  for (const id of ids) {
    const base = `sdks/${id}`;
    const guide = await read(`${base}/docs/guides/proxies.md`);
    assert.match(await read(`${base}/docs/guides/configuration.md`), /\]\(\/guides\/proxies\)/);
    assert.match(guide, /Node\.js/);
    assert.match(guide, /SOCKS5/);

    for (const name of ['proxy-rest', 'proxy-agent']) {
      assert.ok(guide.includes(`<<< @/../examples/${name}.ts`), `${id} includes ${name}`);
      assert.ok((await read(`${base}/examples/${name}.ts`)).length > 0);
    }

    const agent = await read(`${base}/examples/proxy-agent.ts`);
    assert.match(agent, /keepAlive: false/);
    assert.match(agent, /proxy: false/);
    assert.match(agent, /httpsAgent: agent/);
    if (id !== 'hyperliquid') assert.match(agent, /wsOptions: \{ agent \}/);
    if (id === 'binance' || id === 'kraken') {
      assert.match(agent, /requestOptions: networkOptions/);
      assert.match(agent, /restOptions: \{ keepAlive: false \}/);
    }
  }
});

test('Hyperliquid documents and configures its separate socket and metadata routes', async () => {
  const guide = await read('sdks/hyperliquid/docs/guides/proxies.md');
  const example = await read('sdks/hyperliquid/examples/proxy-websocket.ts');
  assert.ok(guide.includes('<<< @/../examples/proxy-websocket.ts'));
  assert.match(example, /webSocketConstructor: ProxiedWebSocket/);
  assert.match(example, /requestOptions: \{\s*proxy:/);
  assert.match(guide, /Metadata routing/);
  assert.match(guide, /A proxied socket does not guarantee that metadata calls use SOCKS/);
});

test('awaitable WebSocket guidance explains the convenience and qualifies latency', async () => {
  const fragment = await read('shared/content/clients/awaitable-websocket.md');
  assert.match(fragment, /`await` and `try`\/`catch`/);
  assert.match(fragment, /matches responses to requests/);
  assert.match(fragment, /depending on the exchange, network and workload/);
  for (const id of ids) {
    assert.match(await read(`sdks/${id}/docs/clients.md`), /shared\/clients\/awaitable-websocket\.md/);
  }
  assert.match(await read('sdks/hyperliquid/docs/guides/websockets.md'), /shared\/clients\/awaitable-websocket\.md/);
});
