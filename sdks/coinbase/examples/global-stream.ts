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

// Replace this with an instrument returned by getInstruments().
ws.subscribe('ticker.BTC_USDC-PERPETUAL.100ms', WS_KEY_MAP.advTradeGlobalMarketData);

function stop() {
  ws.closeAll();
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
