export const endpoints = {"rest": "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", "websocket": "wss://stream.binance.com:9443"};
export function client(sdk) { return new sdk.MainClient({}, {timeout:15000}); }
export async function read(client) {
  const response = await client.getSymbolPriceTicker({ symbol: 'BTCUSDT' });
  if (Array.isArray(response)) throw new Error('Expected one ticker');
  return response.price;
}
export function stream(sdk, logger) { return new sdk.WebsocketClient({}, logger); }
export const event = 'message';
export function value(message) { return message.e === '24hrTicker' ? message.c : undefined; }
export async function subscribe(ws) { await ws.subscribeSpotSymbol24hrTicker('btcusdt'); }
export const typeExample = `import { MainClient, WebsocketClient } from 'binance';
new MainClient().getSymbolPriceTicker({ symbol: 'BTCUSDT' }).then(r => { if (!Array.isArray(r)) return r.price; });
new WebsocketClient({}).closeAll();
`;
