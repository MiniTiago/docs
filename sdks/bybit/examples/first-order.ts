import { RestClientV5 } from 'bybit-api';

// Subscribe to the matching account WebSocket stream before submitting orders.
// Use its order and fill updates for ongoing state. The explicit status command
// is a one-shot diagnostic for unresolved state, not a post-submit/cancel step.

function requiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

async function printOrderStatus(client: RestClientV5, orderId: string) {
  const query = { category: 'linear' as const, symbol: 'BTCUSDT', orderId };
  // Realtime results include recent closed orders.
  const activeResponse = await client.getActiveOrders(query);
  const order = activeResponse.result.list.find(
    (item) => item.orderId === orderId,
  );
  if (!order) {
    throw new Error(
      'Order not found. Check Testnet order history before placing another order.',
    );
  }
  console.log({
    orderId,
    orderStatus: order.orderStatus,
    cumExecQty: order.cumExecQty,
    leavesQty: order.leavesQty,
  });
}

async function main() {
  if (process.env.BYBITTRACE) {
    throw new Error('Unset BYBITTRACE to keep signed requests out of logs.');
  }
  const action = process.argv[2];
  if (!['place', 'status', 'cancel'].includes(action)) {
    throw new Error('Usage: first-order.ts place|status|cancel');
  }

  const client = new RestClientV5(
    {
      key: requiredEnvVar('BYBIT_API_KEY'),
      secret: requiredEnvVar('BYBIT_API_SECRET'),
      testnet: true,
      throwExceptions: true,
    },
    { timeout: 10_000 },
  );
  const market = { category: 'linear' as const, symbol: 'BTCUSDT' };

  if (action === 'place') {
    const response = await client.submitOrder({
      ...market,
      side: 'Buy',
      orderType: 'Limit',
      price: requiredEnvVar('BYBIT_LIMIT_PRICE'),
      qty: requiredEnvVar('BYBIT_ORDER_QTY'),
      timeInForce: 'PostOnly',
      positionIdx: 0,
    });
    console.log('Order ID:', response.result.orderId);
    console.log(
      'Save this as BYBIT_ORDER_ID. Follow the private WebSocket for order updates.',
    );
    return;
  }

  // Status and cancellation use the ID returned by submitOrder().
  const orderId = requiredEnvVar('BYBIT_ORDER_ID');
  if (action === 'cancel') {
    await client.cancelOrder({ ...market, orderId });
    console.log(
      'Cancellation acknowledged. Follow the private WebSocket for order updates.',
    );
    return;
  }

  await printOrderStatus(client, orderId);
}

main().catch((error: unknown) => {
  console.error(error);
  console.error(
    'Use private WebSocket updates to resolve the outcome. If still unknown, make a targeted REST query before deciding whether to retry.',
  );
  process.exitCode = 1;
});
