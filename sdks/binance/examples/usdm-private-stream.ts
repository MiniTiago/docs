import { WebsocketClient } from 'binance';

async function main() {
  const api_key = process.env.BINANCE_API_KEY;
  const api_secret = process.env.BINANCE_API_SECRET;
  if (!api_key || !api_secret) {
    throw new Error(
      'Set USD-M Demo credentials in BINANCE_API_KEY and BINANCE_API_SECRET.',
    );
  }

  const ws = new WebsocketClient({
    api_key,
    api_secret,
    demoTrading: true,
    beautify: false,
  });
  let stopped = false;
  // Bound the example, including initial listen-key and connection setup.
  const timer = setTimeout(stop, 60_000);
  function stop() {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    ws.closeAll(true);
    console.log('USD-M user data stream closed. This does not cancel orders.');
  }
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  // Install listeners before connecting. This stream passively receives changes;
  // it does not submit orders or query state after each REST submission.
  ws.on('message', (message) => {
    if (stopped || Array.isArray(message)) return;
    if (message.e === 'ORDER_TRADE_UPDATE') {
      console.log('Order update:', {
        symbol: message.o.s,
        orderId: message.o.i,
        executionType: message.o.x,
        status: message.o.X,
        lastExecutedQuantity: message.o.l,
        cumulativeExecutedQuantity: message.o.z,
      });
    } else if (message.e === 'ACCOUNT_UPDATE') {
      console.log('Balance and position updates:', message.a);
    } else if (message.e === 'listenKeyExpired') {
      console.error('User data listen key expired. Account updates may have a gap.');
    }
  });
  ws.on('open', () => {
    if (stopped) {
      ws.closeAll(true);
      return;
    }
    console.log('USD-M Demo user data connected. Waiting for account events.');
  });
  ws.on('exception', (error) => {
    console.error('USD-M user data stream exception:', error);
  });
  // The SDK manages listen-key renewal and reconnecting.
  ws.on('reconnecting', () => console.log('USD-M user data reconnecting.'));
  ws.on('reconnected', () => {
    if (stopped) {
      ws.closeAll(true);
      return;
    }
    console.log('USD-M user data reconnected.');
    // If missed events leave state unresolved, use a targeted REST recovery query.
  });

  try {
    // This opens a dedicated listen-key connection, not a topic subscription.
    // Setup can return undefined after emitting an exception; awaiting it alone
    // is not proof that the stream connected. Observe the open event above.
    await ws.subscribeUsdFuturesUserDataStream();
  } catch (error) {
    console.error('Could not start the USD-M user data stream:', error);
    process.exitCode = 1;
    stop();
  } finally {
    // A stop can occur while listen-key/connection setup is pending.
    if (stopped) ws.closeAll(true);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
