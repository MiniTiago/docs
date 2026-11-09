import { WebsocketClient } from '@siebly/hyperliquid-api';

async function main() {
  const client = new WebsocketClient();
  const timer = setTimeout(stop, 30_000);
  function stop() {
    clearTimeout(timer);
    client.closeAll();
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }

  client.on('exception', (event) => console.error(event));
  client.on('message', (event) => {
    if (event.channel === 'allMids') {
      console.log('BTC mid price:', event.data.mids.BTC);
    } else {
      console.log('Market update:', event);
    }
  });
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  try {
    await client.subscribe({ type: 'allMids' });
  } catch (error) {
    stop();
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
