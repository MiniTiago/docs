import { MainClient } from 'binance';

class InputError extends Error {}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new InputError(`Set ${name} in .env.`);
  }
  return value;
}

function positiveNumber(name: string): number {
  const value = Number(required(name));
  if (!Number.isFinite(value) || value <= 0) {
    throw new InputError(`${name} must be a positive number.`);
  }
  return value;
}

async function main() {
  const action = process.argv[2];
  if (!['place', 'status', 'cancel'].includes(action)) {
    throw new InputError('Usage: first-order.ts place|status|cancel');
  }

  const client = new MainClient(
    {
      api_key: required('BINANCE_TESTNET_API_KEY'),
      api_secret: required('BINANCE_TESTNET_API_SECRET'),
      testnet: true,
    },
    { timeout: 10_000 },
  );
  const symbol = required('BINANCE_SYMBOL');

  if (action === 'place') {
    // A client ID lets you look up a submission even if its response is lost.
    const clientOrderId = required('BINANCE_CLIENT_ORDER_ID');
    console.log('Submitting client order ID:', clientOrderId);
    const order = await client.submitNewOrder({
      symbol,
      side: 'BUY',
      type: 'LIMIT_MAKER',
      price: positiveNumber('BINANCE_PRICE'),
      quantity: positiveNumber('BINANCE_QUANTITY'),
      newClientOrderId: clientOrderId,
    });
    console.log(
      'Submission acknowledged. Save BINANCE_ORDER_ID:',
      order.orderId,
    );
    return;
  }

  if (action === 'cancel') {
    // The exchange order ID stays stable when cancellation changes the client ID.
    await client.cancelOrder({
      symbol,
      orderId: positiveNumber('BINANCE_ORDER_ID'),
    });
    console.log('Cancellation acknowledged. Run status to check the result.');
    return;
  }

  const lookup = process.env.BINANCE_ORDER_ID
    ? { symbol, orderId: positiveNumber('BINANCE_ORDER_ID') }
    : { symbol, origClientOrderId: required('BINANCE_CLIENT_ORDER_ID') };
  const order = await client.getOrder(lookup);
  console.log({
    orderId: order.orderId,
    status: order.status,
    executedQuantity: order.executedQty,
    originalQuantity: order.origQty,
  });
}

main().catch((error: unknown) => {
  // Raw transport errors can contain signed request details.
  console.error(
    error instanceof InputError
      ? error.message
      : 'Request failed. Keep the same order ID and run status before any further order action.',
  );
  process.exitCode = 1;
});
