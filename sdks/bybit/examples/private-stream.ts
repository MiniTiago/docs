import { WebsocketClient } from 'bybit-api';

function main() {
  if (process.env.BYBITTRACE) {
    throw new Error('Unset BYBITTRACE to keep signed requests out of logs.');
  }
  const key = process.env.BYBIT_API_KEY;
  const secret = process.env.BYBIT_API_SECRET;
  if (!key || !secret) {
    throw new Error('Set BYBIT_API_KEY and BYBIT_API_SECRET.');
  }

  // Keep routine SDK logs quiet while preserving errors.
  const ws = new WebsocketClient(
    { key, secret, testnet: true },
    { trace() {}, info() {}, error: console.error },
  );
  let stopped = false;
  let subscribed = false;

  function stop() {
    if (stopped) {
      return;
    }
    stopped = true;
    clearTimeout(timer);
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    ws.closeAll(true);
    console.log('Private stream closed. This does not cancel orders.');
  }

  function fail(message: string, ...details: unknown[]) {
    console.error(message, ...details);
    process.exitCode = 1;
    stop();
  }

  // Bound the whole example, including connection and authentication time.
  const timer = setTimeout(() => {
    if (!subscribed) {
      fail(
        'Subscription was not confirmed. Check credentials and connectivity.',
      );
    } else {
      stop();
    }
  }, 60_000);
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  // Install listeners before initiating the subscription.
  ws.on('authenticated', () => console.log('Private stream authenticated.'));
  ws.on('response', (message) => {
    if (stopped || message.op !== 'subscribe') {
      return;
    }
    if (message.success === true) {
      subscribed = true;
      console.log('Subscribed to order.linear. Waiting for order changes.');
    } else {
      fail('Private subscription rejected:', message);
    }
  });
  ws.on('update', (message) => {
    if (
      stopped ||
      message.topic !== 'order.linear' ||
      !Array.isArray(message.data)
    ) {
      return;
    }
    for (const order of message.data) {
      console.log({
        orderLinkId: order.orderLinkId,
        symbol: order.symbol,
        orderStatus: order.orderStatus,
        cumExecQty: order.cumExecQty,
        leavesQty: order.leavesQty,
      });
    }
  });
  ws.on('exception', (error) => fail('Private stream failed:', error));
  ws.on('reconnect', (event) =>
    fail(
      'Connection interrupted. Reconcile orders with REST before restarting.',
      event,
    ),
  );
  ws.on('close', (event) => {
    if (!stopped) {
      fail('Connection closed unexpectedly:', event);
    }
  });

  try {
    // The response event above confirms subscription, not this promise alone.
    void Promise.all(ws.subscribeV5('order.linear', 'linear')).catch(
      (error) => {
        fail('Private subscription failed:', error);
      },
    );
  } catch (error) {
    fail('Could not start the private stream:', error);
  }
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
