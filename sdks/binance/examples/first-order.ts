import { MainClient } from 'binance';

function requiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name} in .env.`);
  }
  return value;
}

function getPositiveNumberEnvVar(name: string): number {
  const value = Number(requiredEnvVar(name));
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
  return value;
}

async function main() {
  const action = process.argv[2];
  if (!['place', 'status', 'cancel'].includes(action)) {
    throw new Error('Usage: first-order.ts place|status|cancel');
  }

  const client = new MainClient(
    {
      api_key: requiredEnvVar('BINANCE_TESTNET_API_KEY'),
      api_secret: requiredEnvVar('BINANCE_TESTNET_API_SECRET'),
      testnet: true,
    },
    { timeout: 10_000 },
  );
  const symbol = requiredEnvVar('BINANCE_SYMBOL');

  if (action === 'place') {
    const order = await client.submitNewOrder({
      symbol,
      side: 'BUY',
      type: 'LIMIT_MAKER',
      price: getPositiveNumberEnvVar('BINANCE_PRICE'),
      quantity: getPositiveNumberEnvVar('BINANCE_QUANTITY'),
    });
    console.log(
      'Submission acknowledged. Save BINANCE_ORDER_ID:',
      order.orderId,
    );
    return;
  }

  if (action === 'cancel') {
    await client.cancelOrder({
      symbol,
      orderId: getPositiveNumberEnvVar('BINANCE_ORDER_ID'),
    });
    console.log('Cancellation acknowledged. Run status to check the result.');
    return;
  }

  const order = await client.getOrder({
    symbol,
    orderId: getPositiveNumberEnvVar('BINANCE_ORDER_ID'),
  });
  console.log({
    orderId: order.orderId,
    status: order.status,
    executedQuantity: order.executedQty,
    originalQuantity: order.origQty,
  });
}

main().catch((error: unknown) => {
  console.error(error);
  console.error(
    'If the outcome is uncertain, check order and trade history before submitting again.',
  );
  process.exitCode = 1;
});
