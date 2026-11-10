export const exchanges = {
  kraken: {
    restClient: 'SpotClient',
    symbol: 'BTC/USD',
    request: `const client = new SpotClient();
const response = await client.getTicker({ pair: 'XBTUSD' });
const ticker = Object.values(response.result)[0];
const price = ticker?.c[0];`,
    browserRequest: `// Public GET requests only. Keep credentials on your server.
const client = new SpotClient({}, {
  transformRequest: [function (data, headers) {
    if (this.method !== 'get') {
      throw new Error('This browser client supports public GET requests only.');
    }
    // These SDK defaults trigger a preflight Kraken does not accept.
    headers.delete('UserAgent');
    headers.delete('locale');
    return data;
  }],
});
const response = await client.getTicker({ pair: 'XBTUSD' });
const ticker = Object.values(response.result)[0];
const price = ticker?.c[0];`,
    event: 'message',
    update: `if (message.channel !== 'ticker') {
  console.log('WebSocket message:', message);
  return;
}

const price = message.data?.[0]?.last;`,
    websocket: 'new WebsocketClient()',
    subscription: "Promise.resolve(ws.subscribe({ topic: 'ticker', payload: { symbol: ['BTC/USD'] } }, 'spotPublicV2'))",
  },
  hyperliquid: {
    restClient: 'RestClient',
    symbol: 'BTC',
    request: `const client = new RestClient();
const mids = await client.getAllMids();
const price = mids.BTC;`,
    event: 'message',
    update: `if (message.channel !== 'allMids') {
  return;
}

const price = message.data?.mids?.BTC;`,
    websocket: 'new WebsocketClient()',
    subscription: "ws.subscribe({ type: 'allMids' })",
  },
  bybit: {
    restClient: 'RestClientV5',
    symbol: 'BTCUSDT',
    request: `const client = new RestClientV5();
const response = await client.getTickers({
  category: 'spot',
  symbol: 'BTCUSDT',
});

if (response.retCode !== 0) {
  throw new Error(response.retMsg);
}

const price = response.result.list[0]?.lastPrice;`,
    event: 'update',
    update: `if (message.topic !== 'tickers.BTCUSDT') {
  return;
}

const price = message.data?.lastPrice;`,
    websocket: 'new WebsocketClient({})',
    subscription: "Promise.all(ws.subscribeV5('tickers.BTCUSDT', 'spot'))",
  },
  binance: {
    restClient: 'MainClient',
    symbol: 'BTCUSDT',
    request: `const client = new MainClient();
const ticker = await client.getSymbolPriceTicker({
  symbol: 'BTCUSDT',
});

if (Array.isArray(ticker)) {
  throw new Error('Expected a single-symbol ticker.');
}

const price = ticker.price;`,
    event: 'message',
    typescriptGuard: `if (
  Array.isArray(message) ||
  !('e' in message) ||
  !('c' in message)
) {
  return;
}

`,
    update: `if (message.e !== '24hrTicker') {
  return;
}

const price = message.c;`,
    websocket: 'new WebsocketClient({})',
    subscription: "ws.subscribeSpotSymbol24hrTicker('btcusdt')",
  },
};
