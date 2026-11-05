import { WebsocketClient } from '@siebly/hyperliquid-api';
import process from 'node:process';

async function main() {
  const ws = new WebsocketClient();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  try {
    const firstPrice = new Promise<string>((resolve, reject) => {
      timeout = setTimeout(() => {
        reject(new Error('No BTC update within 30 seconds.'));
      }, 30_000);

      ws.on('message', (message) => {
        if (message.channel !== 'allMids') {
          return;
        }

        const price = message.data?.mids?.BTC;

        if (price) {
          resolve(String(price));
        }
      });
      ws.on('exception', reject);

      const subscription = ws.subscribe({ type: 'allMids' });
      subscription.catch(reject).finally(() => {
        if (stopped) {
          ws.closeAll();
        }
      });
    });

    console.log('BTC WebSocket price:', await firstPrice);
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
