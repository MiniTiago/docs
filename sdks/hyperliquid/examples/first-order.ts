import { RestClient } from '@siebly/hyperliquid-api';

function requiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name} in your .env file.`);
  }
  return value;
}

function createTestnetClient(action: string): RestClient {
  const accountAddress = requiredEnvVar('HYPERLIQUID_ACCOUNT_ADDRESS');
  // Status queries do not require a signing key.
  const privateKey =
    action === 'status' ? undefined : requiredEnvVar('HYPERLIQUID_PRIVATE_KEY');
  return new RestClient(
    { testnet: true, accountAddress, privateKey },
    { timeout: 10_000 },
  );
}

async function placeOrder(client: RestClient) {
  const result = await client.submitLimitOrder({
    symbol: 'BTC',
    side: 'buy',
    price: requiredEnvVar('HYPERLIQUID_LIMIT_PRICE'),
    size: requiredEnvVar('HYPERLIQUID_ORDER_SIZE'),
    postOnly: true,
  });

  // Check the individual order result, not just the HTTP response.
  if (result.status !== 'ok') {
    console.error(result);
    throw new Error('Order was not accepted.');
  }
  const order = result.response.data.statuses[0];
  if (!order || 'error' in order) {
    console.error(result);
    throw new Error('Order was rejected.');
  }
  const orderId = 'resting' in order ? order.resting.oid : order.filled.oid;
  console.log('Order result:', 'resting' in order ? 'resting' : 'filled');
  console.log('HYPERLIQUID_ORDER_ID=' + orderId);
}

async function main() {
  const action = process.argv[2];
  if (!['place', 'status', 'cancel'].includes(action)) {
    throw new Error('Usage: orders.mts place|status|cancel');
  }
  const client = createTestnetClient(action);

  if (action === 'place') {
    await placeOrder(client);
    return;
  }

  const orderId = Number(requiredEnvVar('HYPERLIQUID_ORDER_ID'));
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    throw new Error(
      'HYPERLIQUID_ORDER_ID must be the numeric ID returned by the exchange.',
    );
  }
  const status = await client.getOrderStatus({ oid: orderId });
  if (status.status === 'unknownOid') {
    console.log('Order not found for this account and order ID.');
    process.exitCode = 1;
    return;
  }
  console.log(
    'Order ID:',
    status.order.order.oid,
    'Status:',
    status.order.status,
  );
  if (action === 'status') {
    return;
  }
  if (status.order.status !== 'open') {
    console.log('Order is no longer open; nothing to cancel.');
    return;
  }

  const result = await client.cancelOrders({
    cancels: [{ a: 'BTC', o: orderId }],
  });
  if (
    result.status !== 'ok' ||
    result.response.data.statuses[0] !== 'success'
  ) {
    console.error(result);
    throw new Error(
      'Cancellation was not confirmed. Run status; the order may already have filled.',
    );
  }
  console.log(
    'Cancellation accepted. Run status to confirm the final order state.',
  );
}

main().catch((error: unknown) => {
  console.error(error);
  console.error(
    'Check order status or account order history before resubmitting an uncertain request.',
  );
  process.exitCode = 1;
});
