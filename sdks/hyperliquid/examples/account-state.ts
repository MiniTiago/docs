import { RestClient } from '@siebly/hyperliquid-api';

async function main() {
  const accountAddress = process.env.HYPERLIQUID_ACCOUNT_ADDRESS;
  if (!accountAddress) throw new Error('Set HYPERLIQUID_ACCOUNT_ADDRESS.');

  const client = new RestClient({ accountAddress });
  const account = await client.getPerpAccountSummary();
  console.log(account.assetPositions);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
