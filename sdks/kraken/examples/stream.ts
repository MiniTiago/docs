import { WebsocketClient, WS_KEY_MAP } from '@siebly/kraken-api';

const ws = new WebsocketClient({});

ws.on('message', (message) => console.log(message));
ws.on('response', (response) =>
  console.log('Subscription response:', response),
);
ws.on('exception', (error) => console.error('WebSocket exception:', error));
ws.on('reconnecting', (event) => console.log('Reconnecting:', event));
ws.on('reconnected', (event) => console.log('Reconnected:', event));

ws.subscribe(
  { topic: 'ticker', payload: { symbol: ['BTC/USD'] } },
  WS_KEY_MAP.spotPublicV2,
);

const timer = setTimeout(stop, 30000);
function stop() {
  clearTimeout(timer);
  ws.closeAll();
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
