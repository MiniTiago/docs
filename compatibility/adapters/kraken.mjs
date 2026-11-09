export const endpoints = {
  rest: 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD',
  websocket: 'wss://ws.kraken.com/v2',
};
export function client(sdk) {
  return new sdk.SpotClient({}, { timeout: 15000 });
}
export async function read(client) {
  const response = await client.getTicker({ pair: 'XBTUSD' });
  return Object.values(response.result)[0]?.c[0];
}
export function stream(sdk) {
  return new sdk.WebsocketClient();
}
export const event = 'message';
export function value(message) {
  return message.channel === 'ticker' ? message.data?.[0]?.last : undefined;
}
export async function subscribe(ws) {
  ws.subscribe({ topic: 'ticker', payload: { symbol: ['BTC/USD'] } }, 'spotPublicV2');
}
export const typeExample = `import { SpotClient, WebsocketClient } from '@siebly/kraken-api';
new SpotClient().getTicker({ pair: 'XBTUSD' });
new WebsocketClient().closeAll();
`;
