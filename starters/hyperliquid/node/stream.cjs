const { WebsocketClient } = require('@siebly/hyperliquid-api');
const process = require('node:process');

async function main() {
  const ws = new WebsocketClient();
  let timeout;
  let stopped = false;

  try {
    const firstPrice = new Promise((resolve, reject) => {
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
