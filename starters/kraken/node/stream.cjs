const { WebsocketClient } = require('@siebly/kraken-api');
const process = require('node:process');

async function main() {
  const ws = new WebsocketClient();
  let timeout;
  let stopped = false;

  try {
    const firstPrice = new Promise((resolve, reject) => {
      timeout = setTimeout(() => {
        reject(new Error('No BTC/USD update within 30 seconds.'));
      }, 30_000);

      ws.on('message', (message) => {
        if (message.channel !== 'ticker') {
          console.log('WebSocket message:', message);
          return;
        }

        const price = message.data?.[0]?.last;

        if (price) {
          resolve(String(price));
        }
      });
      ws.on('exception', reject);

      const subscription = Promise.resolve(ws.subscribe({ topic: 'ticker', payload: { symbol: ['BTC/USD'] } }, 'spotPublicV2'));
      subscription.catch(reject).finally(() => {
        if (stopped) {
          ws.closeAll();
        }
      });
    });

    console.log('BTC/USD WebSocket price:', await firstPrice);
  } finally {
    stopped = true;
    clearTimeout(timeout);
    ws.closeAll();
    console.log('WebSocket closed.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
