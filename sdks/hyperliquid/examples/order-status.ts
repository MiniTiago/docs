import { RestClient } from '@siebly/hyperliquid-api';

async function main() {
  const accountAddress = process.env.HYPERLIQUID_ACCOUNT_ADDRESS;
  const clientOrderId = process.env.HYPERLIQUID_CLIENT_ORDER_ID;
  if (!accountAddress || !clientOrderId) {
    throw new Error('Set HYPERLIQUID_ACCOUNT_ADDRESS and HYPERLIQUID_CLIENT_ORDER_ID.');
  }

  const client = new RestClient({ accountAddress });
  const result = await client.getOrderStatus({ oid: clientOrderId });
  if (result.status === 'unknownOid') {
    console.log('Order not found. Check the account, network and client order ID.');
    return;
  }
  console.log('Order status:', result.order.status);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
