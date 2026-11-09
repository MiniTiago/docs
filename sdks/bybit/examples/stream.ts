import { WebsocketClient } from 'bybit-api';

const ws = new WebsocketClient({});
let stopped = false;
let timer: ReturnType<typeof setTimeout> | undefined;
function stop() {
  if (stopped) {
    return;
  }
  stopped = true;
  clearTimeout(timer);
  ws.closeAll();
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
ws.on('update', (message) => console.log(message));
ws.on('response', (message) => console.log('Subscription response:', message));
ws.on('exception', (error) => console.error('WebSocket exception:', error));
async function main() {
  // Subscription acceptance is reported by response, and rejection by exception.
  await Promise.all(ws.subscribeV5('tickers.BTCUSDT', 'spot'));
  if (!stopped) {
    timer = setTimeout(stop, 30000);
  }
}
main().catch((error) => {
  console.error('Could not start the stream:', error);
  process.exitCode = 1;
  stop();
});
