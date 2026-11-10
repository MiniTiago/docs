import { WebsocketClient, WS_KEY_MAP } from 'coinbase-api';

const ws = new WebsocketClient();

ws.on('update', (event) => {
  console.log(event);
});
ws.on('response', (event) => {
  console.log('Subscription response:', event);
});
ws.on('exception', (error) => {
  console.error('WebSocket exception:', error);
});
ws.on('reconnect', (event) => {
  console.log('Reconnecting:', event);
});
ws.on('reconnected', (event) => {
  console.log('Reconnected:', event);
});

ws.subscribe(
  [
    { topic: 'ticker', payload: { product_ids: ['BTC-USD'] } },
    { topic: 'heartbeats' },
  ],
  WS_KEY_MAP.advTradeMarketData,
);

function stop() {
  ws.closeAll();
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
