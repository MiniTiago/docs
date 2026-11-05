@@IMPORT@@

async function main() {
  const ws = @@WEBSOCKET@@;
  let timeout@@TIMEOUT_TYPE@@;
  let stopped = false;

  try {
    const firstPrice = new Promise@@PROMISE_TYPE@@((resolve, reject) => {
      timeout = setTimeout(() => {
        reject(new Error('No @@SYMBOL@@ update within 30 seconds.'));
      }, 30_000);

      ws.on('@@EVENT@@', (message) => {
@@UPDATE@@

        if (price) {
          resolve(String(price));
        }
      });
      ws.on('exception', reject);

      const subscription = @@SUBSCRIPTION@@;
      subscription.catch(reject).finally(() => {
        if (stopped) {
          ws.closeAll();
        }
      });
    });

    console.log('@@SYMBOL@@ WebSocket price:', await firstPrice);
  } finally {
    stopped = true;
    clearTimeout(timeout);
    ws.closeAll();
    console.log('WebSocket closed.');
  }
}

main().catch((error@@ERROR_TYPE@@) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
