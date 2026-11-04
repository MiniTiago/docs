import { RestClient } from '@siebly/hyperliquid-api';

export function createTradingClient() {
  const privateKey = process.env.HYPERLIQUID_PRIVATE_KEY;
  const accountAddress = process.env.HYPERLIQUID_ACCOUNT_ADDRESS;
  if (!privateKey || !accountAddress) {
    throw new Error('Set HYPERLIQUID_PRIVATE_KEY and HYPERLIQUID_ACCOUNT_ADDRESS.');
  }

  return new RestClient({
    testnet: true,
    privateKey,
    accountAddress,
  });
}
