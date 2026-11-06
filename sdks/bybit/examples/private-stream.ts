import { WebsocketClient } from 'bybit-api';

function main() {
  if (process.env.BYBITTRACE) throw new Error('Unset BYBITTRACE to avoid logging signed request headers.');
  if (process.env.BYBIT_TESTNET_STREAM !== 'I_UNDERSTAND') throw new Error('Set BYBIT_TESTNET_STREAM=I_UNDERSTAND.');
  const key = process.env.BYBIT_API_KEY, secret = process.env.BYBIT_API_SECRET;
  if (!key?.trim() || !secret?.trim() || key.includes('replace_') || secret.includes('replace_')) {
    throw new Error('Set real Testnet BYBIT_API_KEY and BYBIT_API_SECRET values.');
  }
  const duration = Number(process.env.BYBIT_STREAM_SECONDS || '60');
  if (!Number.isInteger(duration) || duration < 5 || duration > 300) throw new Error('BYBIT_STREAM_SECONDS must be 5–300.');
  // Suppress raw SDK diagnostics, which can contain private payloads.
  const ws = new WebsocketClient({ key, secret, testnet: true }, { trace() {}, info() {}, error() {} });
  let stopped = false, subscribed = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    clearTimeout(startup);
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    ws.closeAll(true);
    console.log('Private stream closed. This does not cancel orders.');
  };
  const fail = () => { process.exitCode = 1; stop(); };
  const timer = setTimeout(stop, duration * 1000);
  const startup = setTimeout(() => {
    if (!subscribed) { console.error('No subscription acknowledgement within 10 seconds.'); fail(); }
  }, 10000);
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  // Install every listener before initiating the connection/subscription.
  ws.on('authenticated', () => console.log('Private stream authenticated.'));
  ws.on('response', message => {
    if (stopped || message.op !== 'subscribe') return;
    if (message.success === true) {
      subscribed = true;
      clearTimeout(startup);
      console.log('Subscribed to order.linear. Waiting for order changes.');
    } else { console.error('Private subscription rejected.'); fail(); }
  });
  ws.on('update', message => {
    if (stopped || message.topic !== 'order.linear' || !Array.isArray(message.data)) return;
    for (const order of message.data) {
      console.log({ orderId: order.orderId, orderLinkId: order.orderLinkId, symbol: order.symbol,
        orderStatus: order.orderStatus, cumExecQty: order.cumExecQty, leavesQty: order.leavesQty,
        updatedTime: order.updatedTime });
    }
  });
  ws.on('exception', () => { console.error('Private stream failed. Check Testnet credentials and permissions.'); fail(); });
  // Stop rather than treating a reconnected stream as complete order history.
  ws.on('reconnect', () => { console.error('Connection interrupted. Reconcile orders with REST before restarting.'); fail(); });
  ws.on('close', () => { if (!stopped) { console.error('Connection closed unexpectedly.'); fail(); } });
  try {
    // These promises alone do not prove a fresh connection has subscribed: observe response above.
    void Promise.all(ws.subscribeV5('order.linear', 'linear')).catch(() => {
      console.error('Private subscription failed.'); fail();
    });
  } catch { console.error('Could not start private stream.'); fail(); }
}
try { main(); } catch (error) {
  console.error(error instanceof Error ? error.message : 'Invalid stream configuration.');
  process.exitCode = 1;
}
