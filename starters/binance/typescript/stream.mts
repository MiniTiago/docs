import { WebsocketClient } from 'binance';
import process from 'node:process';

async function main() {
  const ws = new WebsocketClient({});
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  try {
    const firstPrice = new Promise<string>((resolve, reject) => {
      timeout = setTimeout(() => {
        reject(new Error('No BTCUSDT update within 30 seconds.'));
      }, 30_000);

      ws.on('message', (message) => {
        if (
          Array.isArray(message) ||
          !('e' in message) ||
          !('c' in message)
        ) {
          return;
        }

        if (message.e !== '24hrTicker') {
          return;
        }

        const price = message.c;

        if (price) {
          resolve(String(price));
        }
      });
      ws.on('exception', reject);

      const subscription = ws.subscribeSpotSymbol24hrTicker('btcusdt');
      subscription.catch(reject).finally(() => {
        if (stopped) {
          ws.closeAll();
        }
      });
    });

    console.log('BTCUSDT WebSocket price:', await firstPrice);
  } finally {
    stopped = true;
    clearTimeout(timeout);
    ws.closeAll();
    console.log('WebSocket closed.');
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
