export const operations = {
  rest: 'CBAdvancedTradeClient.getPublicProduct()',
  websocket: 'WebsocketClient.subscribe()',
};
export function client(sdk) {
  return new sdk.CBAdvancedTradeClient({}, { timeout: 15000 });
}
export async function read(client) {
  const ticker = await client.getPublicProduct({ product_id: 'BTC-USD' });
  return ticker.price;
}
export function stream(sdk) {
  return new sdk.WebsocketClient();
}
export const event = 'update';
export function value(message) {
  return message.channel === 'ticker' ? message.events?.flatMap(event => event.tickers || []).find(ticker => ticker.product_id === 'BTC-USD')?.price : undefined;
}
export async function subscribe(ws) {
  ws.subscribe({ topic: 'ticker', payload: { product_ids: ['BTC-USD'] } }, 'advTradeMarketData');
}
export const typeExample = `import { CBAdvancedTradeClient, WebsocketClient } from 'coinbase-api';
new CBAdvancedTradeClient().getPublicProduct({ product_id: 'BTC-USD' });
new WebsocketClient().closeAll();
`;
