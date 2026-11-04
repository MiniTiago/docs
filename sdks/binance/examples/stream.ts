import { WebsocketClient } from 'binance';

const ws = new WebsocketClient({});
let stopped = false;
let timer: ReturnType<typeof setTimeout> | undefined;
function stop() {
  if (stopped) return;
  stopped = true;
  clearTimeout(timer);
  ws.closeAll();
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
ws.on('message', (message) => console.log(message));
ws.on('exception', () => {
  console.error('WebSocket exception. Check the topic, environment and connection.');
});
async function main() {
  await ws.subscribeSpotSymbol24hrTicker('btcusdt');
  if (!stopped) timer = setTimeout(stop, 30000);
}
main().catch(() => {
  console.error('Subscription failed.');
  process.exitCode = 1;
  stop();
});
