import { RestClient } from '@siebly/hyperliquid-api';

async function main() {
  const accountAddress = process.env.HYPERLIQUID_ACCOUNT_ADDRESS;
  const savedOrderId = process.env.HYPERLIQUID_ORDER_ID;
  if (!accountAddress || !savedOrderId) {
    throw new Error(
      'Set HYPERLIQUID_ACCOUNT_ADDRESS and HYPERLIQUID_ORDER_ID.',
    );
  }

  const orderId = Number(savedOrderId);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    throw new Error(
      'HYPERLIQUID_ORDER_ID must be the numeric ID returned by the exchange.',
    );
  }

  const client = new RestClient({ accountAddress });
  const result = await client.getOrderStatus({ oid: orderId });
  if (result.status === 'unknownOid') {
    console.log('Order not found. Check the account, network and order ID.');
    return;
  }
  console.log('Order status:', result.order.status);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
