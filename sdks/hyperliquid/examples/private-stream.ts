import { WebsocketClient } from '@siebly/hyperliquid-api';

async function main() {
  const user = process.env.HYPERLIQUID_ACCOUNT_ADDRESS;
  if (!user || !/^0x[\da-fA-F]{40}$/.test(user)) {
    throw new Error(
      'Set HYPERLIQUID_ACCOUNT_ADDRESS to the managed account address.',
    );
  }
  const ws = new WebsocketClient({ testnet: true });

  let stopped = false;
  const timer = setTimeout(stop, 60_000);
  function stop() {
    if (stopped) {
      return;
    }
    stopped = true;
    clearTimeout(timer);
    ws.closeAll();
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  // Install listeners before subscribing so early messages are not missed.
  ws.on('exception', (error) => {
    console.error('Account stream exception:', error);
  });
  ws.on('reconnecting', (event) => {
    console.log('Account stream reconnecting:', event);
  });
  ws.on('reconnected', (event) => {
    console.log('Account stream reconnected:', event);
  });
  ws.on('response', (event) => {
    console.log('Subscription response:', event);
  });
  ws.on('message', (event) => {
    if (stopped) {
      return;
    }
    if (event.channel === 'orderUpdates') {
      for (const update of event.data) {
        console.log(
          'Order:',
          update.order.oid,
          update.order.coin,
          update.status,
        );
      }
    } else if (event.channel === 'userFills' && !event.data.isSnapshot) {
      for (const fill of event.data.fills) {
        console.log(
          'Fill:',
          fill.oid,
          fill.coin,
          'price:',
          fill.px,
          'size:',
          fill.sz,
        );
      }
    }
  });
  try {
    await ws.subscribe([
      { type: 'orderUpdates', user },
      { type: 'userFills', user },
    ]);
  } catch (error) {
    // Topics remain cached for the SDK's automatic reconnect attempts.
    console.error('Subscription setup failed:', error);
  } finally {
    // A stop can occur while subscription setup is pending.
    if (stopped) {
      ws.closeAll();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
