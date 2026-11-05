const { WebsocketClient } = require('bybit-api');
const process = require('node:process');

async function main() {
  const ws = new WebsocketClient({});
  let timeout;
  let stopped = false;

  try {
    const firstPrice = new Promise((resolve, reject) => {
      timeout = setTimeout(() => {
        reject(new Error('No BTCUSDT update within 30 seconds.'));
      }, 30_000);

      ws.on('update', (message) => {
        if (message.topic !== 'tickers.BTCUSDT') {
          return;
        }

        const price = message.data?.lastPrice;

        if (price) {
          resolve(String(price));
        }
      });
      ws.on('exception', reject);

      const subscription = Promise.all(ws.subscribeV5('tickers.BTCUSDT', 'spot'));
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
