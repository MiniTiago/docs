import { USDMClient } from 'binance';

// Subscribe to the matching account WebSocket stream before submitting orders.
// Use its order and fill updates for ongoing state. The explicit status command
// is a one-shot diagnostic for unresolved state, not a post-submit/cancel step.

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
    throw new Error('Usage: usdm-order.ts place|status|cancel');
  }

  const client = new USDMClient(
    {
      api_key: requiredEnvVar('BINANCE_API_KEY'),
      api_secret: requiredEnvVar('BINANCE_API_SECRET'),
      demoTrading: true,
    },
    { timeout: 10_000 },
  );
  const symbol = 'BTCUSDT';

  if (action === 'place') {
    // LIMIT + GTX is post-only. BOTH is for an account already in one-way mode.
    const order = await client.submitNewOrder({
      symbol,
      side: 'BUY',
      positionSide: 'BOTH',
      type: 'LIMIT',
      timeInForce: 'GTX',
      price: getPositiveNumberEnvVar('BINANCE_USDM_PRICE'),
      quantity: getPositiveNumberEnvVar('BINANCE_USDM_QUANTITY'),
    });
    console.log(
      'Submission acknowledged. Save BINANCE_USDM_ORDER_ID:',
      order.orderId,
    );
    return;
  }

  const orderId = getPositiveNumberEnvVar('BINANCE_USDM_ORDER_ID');
  if (action === 'cancel') {
    const order = await client.cancelOrder({ symbol, orderId });
    console.log('Cancellation response:', {
      orderId: order.orderId,
      status: order.status,
      executedQuantity: order.executedQty,
    });
    return;
  }

  const order = await client.getOrder({ symbol, orderId });
  console.log({
    orderId: order.orderId,
    status: order.status,
    executedQuantity: order.executedQty,
    originalQuantity: order.origQty,
  });
}

main().catch((error) => {
  console.error(error);
  console.error(
    'Use account WebSocket updates to resolve the outcome. If still unknown, make a targeted REST query before another order action.',
  );
  process.exitCode = 1;
});
