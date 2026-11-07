import { RestClientV5 } from 'bybit-api';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

function checked<T>(response: { retCode: number; result: T }): T {
  if (response.retCode !== 0) {
    console.error(response);
    throw new Error(`Bybit returned retCode ${response.retCode}.`);
  }
  return response.result;
}

async function printOrderStatus(client: RestClientV5, orderLinkId: string) {
  const query = { category: 'linear' as const, symbol: 'BTCUSDT', orderLinkId };
  // Realtime results include recent closed orders; use history if absent.
  let order = checked(await client.getActiveOrders(query)).list.find(
    (item) => item.orderLinkId === orderLinkId,
  );
  if (!order) {
    order = checked(await client.getHistoricOrders(query)).list.find(
      (item) => item.orderLinkId === orderLinkId,
    );
  }
  if (!order) {
    throw new Error(
      'Order not found. Check Testnet order history before placing another order.',
    );
  }
  console.log({
    orderLinkId,
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
      key: required('BYBIT_API_KEY'),
      secret: required('BYBIT_API_SECRET'),
      testnet: true,
    },
    { timeout: 10_000 },
  );
  // Keep this ID in .env so a later command can find the same order.
  const orderLinkId = required('BYBIT_ORDER_ID');
  const query = { category: 'linear' as const, symbol: 'BTCUSDT', orderLinkId };

  if (action === 'place') {
    console.log('Submitting client order ID:', orderLinkId);
    checked(
      await client.submitOrder({
        ...query,
        side: 'Buy',
        orderType: 'Limit',
        price: required('BYBIT_LIMIT_PRICE'),
        qty: required('BYBIT_ORDER_QTY'),
        timeInForce: 'PostOnly',
        positionIdx: 0,
      }),
    );
    console.log('Submission acknowledged. Run status to inspect the order.');
    return;
  }

  if (action === 'cancel') {
    checked(await client.cancelOrder(query));
    console.log('Cancellation acknowledged. Run status to confirm the result.');
    return;
  }

  await printOrderStatus(client, orderLinkId);
}

main().catch((error: unknown) => {
  console.error(error);
  console.error(
    'Keep BYBIT_ORDER_ID unchanged and run status before another order action.',
  );
  process.exitCode = 1;
});
