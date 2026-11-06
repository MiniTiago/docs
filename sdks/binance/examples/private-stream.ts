import { WebsocketAPIClient, WS_KEY_MAP } from 'binance';

async function main() {
  if (process.env.BINANCE_TESTNET !== 'true') throw new Error('Opt in to Spot Testnet.');
  const api_key = process.env.BINANCE_TESTNET_API_KEY;
  const api_secret = process.env.BINANCE_TESTNET_API_SECRET;
  if (!api_key || !api_secret) throw new Error('Set Spot Testnet credentials.');
  const api = new WebsocketAPIClient({
    api_key, api_secret, testnet: true, beautify: false,
    attachEventListeners: false, muteLatencyWarning: true,
    resubscribeUserDataStreamAfterReconnect: false,
  }, { trace() {}, info() {}, error() {} });
  const ws = api.getWSClient();
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    void api.disconnectAll().catch(() => { process.exitCode = 1; });
  };
  // Includes connection/authentication time, not just the subscribed lifetime.
  const timer = setTimeout(stop, 60000);
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  ws.on('message', message => {
    if (stopped || Array.isArray(message)) return;
    if (message.e === 'executionReport') {
      console.log('Order update:', {
        symbol: message.s, clientOrderId: message.c,
        executionType: message.x, status: message.X,
        lastExecutedQuantity: message.l, cumulativeExecutedQuantity: message.z,
      });
    } else if (message.e === 'outboundAccountPosition' || message.e === 'balanceUpdate') {
      console.log('Account state changed.');
    } else if (message.e === 'eventStreamTerminated') {
      console.error('Subscription ended. Reconcile account state before restarting.');
      stop();
    }
  });
  ws.on('exception', () => {
    console.error('Private stream exception. Check credentials, permissions and connectivity.');
    process.exitCode = 1;
    stop();
  });
  ws.on('reconnecting', () => {
    console.error('Connection interrupted. Reconcile orders and balances before restarting.');
    process.exitCode = 1;
    stop();
  });
  try {
    await api.subscribeUserDataStream(WS_KEY_MAP.mainWSAPI);
    if (stopped) await api.disconnectAll();
    else console.log('Spot Testnet user data subscribed. Waiting for account events.');
  } catch {
    if (!stopped) {
      console.error('Private subscription failed.');
      process.exitCode = 1;
    }
    stop();
  }
}

main().catch(() => {
  console.error('Set BINANCE_TESTNET=true and both Spot Testnet credential variables.');
  process.exitCode = 1;
});
