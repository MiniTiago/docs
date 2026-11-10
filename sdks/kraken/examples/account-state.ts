import { SpotClient } from '@siebly/kraken-api';

async function main() {
  const apiKey = process.env.KRAKEN_API_KEY;
  const apiSecret = process.env.KRAKEN_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error('Set KRAKEN_API_KEY and KRAKEN_API_SECRET.');
  }

  const client = new SpotClient({ apiKey, apiSecret });
  const response = await client.getAccountBalance();
  console.log('Account access verified.');
  console.log('Returned asset balances:', Object.keys(response.result).length);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
