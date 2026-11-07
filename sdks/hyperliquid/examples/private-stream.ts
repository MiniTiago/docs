import { WebsocketClient } from '@siebly/hyperliquid-api';

async function main() {
  const user = process.env.HYPERLIQUID_ACCOUNT_ADDRESS;
  if (!user || !/^0x[\da-fA-F]{40}$/.test(user)) {
    throw new Error(
      'Set HYPERLIQUID_ACCOUNT_ADDRESS to the managed account address.',
    );
  }
  const ws = new WebsocketClient({ testnet: true });

  // Wait for both server acknowledgements before calling the stream ready.
  let stopped = false;
  const pending = new Set(['orderUpdates', 'userFills']);
  const timer = setTimeout(() => {
    if (pending.size) {
      console.error('Account subscriptions were not confirmed.');
      process.exitCode = 1;
    }
    stop();
  }, 60_000);
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
    console.error('Account stream failed:', error);
    process.exitCode = 1;
    stop();
  });
  ws.on('reconnecting', (event) => {
    console.error(
      'Connection lost. Reload order and fill history before restarting this stream.',
      event,
    );
    process.exitCode = 1;
    stop();
  });
  ws.on('response', (event) => {
    if (
      stopped ||
      event.channel !== 'subscriptionResponse' ||
      event.data.method !== 'subscribe'
    ) {
      return;
    }
    const subscription = event.data.subscription;
    if (
      'user' in subscription &&
      subscription.user.toLowerCase() === user.toLowerCase() &&
      pending.delete(subscription.type) &&
      pending.size === 0
    ) {
      console.log('Subscribed to order updates and fills.');
    }
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
    process.exitCode = 1;
    console.error('Could not subscribe to account updates:', error);
    stop();
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
