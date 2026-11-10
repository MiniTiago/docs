export const operations = {
  rest: 'RestClientV5.getTickers()',
  websocket: 'WebsocketClient.subscribeV5()',
};
export function client(sdk) { return new sdk.RestClientV5({}, {timeout:15000}); }
export async function read(client) {
  const response = await client.getTickers({ category: 'spot', symbol: 'BTCUSDT' });
  if (response.retCode !== 0) throw new Error(response.retMsg);
  return response.result.list[0].lastPrice;
}
export function stream(sdk, logger) { return new sdk.WebsocketClient({}, logger); }
export const event = 'update';
export function value(message) { return message.topic === 'tickers.BTCUSDT' ? message.data?.lastPrice : undefined; }
export async function subscribe(ws) { await Promise.all(ws.subscribeV5('tickers.BTCUSDT', 'spot')); }
export const typeExample = `import { RestClientV5, WebsocketClient } from 'bybit-api';
const rest = new RestClientV5();
rest.getTickers({ category: 'spot', symbol: 'BTCUSDT' }).then(r => r.result.list[0].lastPrice);
new WebsocketClient({}).closeAll();
`;
