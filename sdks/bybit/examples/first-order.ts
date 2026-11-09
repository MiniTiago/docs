import { RestClientV5 } from 'bybit-api';

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
  let order = activeResponse.result.list.find(
    (item) => item.orderId === orderId,
  );
  if (!order) {
    // Confirm cancellation if the order is no longer in realtime results.
    const historyResponse = await client.getHistoricOrders({
      ...query,
      orderStatus: 'Cancelled',
    });
    order = historyResponse.result.list.find(
      (item) => item.orderId === orderId,
    );
  }
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
    console.log('Set BYBIT_ORDER_ID to this returned ID, then run status.');
    return;
  }

  // Status and cancellation use the ID returned by submitOrder().
  const orderId = requiredEnvVar('BYBIT_ORDER_ID');
  if (action === 'cancel') {
    await client.cancelOrder({ ...market, orderId });
    console.log('Cancellation acknowledged. Run status to confirm the result.');
    return;
  }

  await printOrderStatus(client, orderId);
}

main().catch((error: unknown) => {
  console.error(error);
  console.error(
    'If the request outcome is uncertain, reconcile orders and fills before resubmitting.',
  );
  process.exitCode = 1;
});
