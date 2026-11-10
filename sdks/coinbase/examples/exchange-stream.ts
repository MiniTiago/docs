import { WebsocketClient, WS_KEY_MAP } from 'coinbase-api';

const ws = new WebsocketClient();

ws.on('update', (event) => {
  console.log(event);
});
ws.on('response', (event) => {
  console.log(event);
});
ws.on('exception', (error) => {
  console.error(error);
});
ws.on('reconnect', (event) => {
  console.log(event);
});
ws.on('reconnected', (event) => {
  console.log(event);
});

ws.subscribe(
  { topic: 'ticker', payload: { product_ids: ['BTC-USD'] } },
  WS_KEY_MAP.exchangeMarketData,
);

function stop() {
  ws.closeAll();
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
