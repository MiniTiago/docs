import { MainClient } from 'binance';

async function main() {
  const api_key = process.env.BINANCE_API_KEY;
  const api_secret = process.env.BINANCE_API_SECRET;
  if (!api_key || !api_secret) throw new Error('Set BINANCE_API_KEY and BINANCE_API_SECRET.');

  const client = new MainClient({ api_key, api_secret, testnet: true });
  const account = await client.getAccountInformation();

  console.log('Account access verified.');
  console.log('Returned balance records:', account.balances.length);
}

main().catch(() => {
  console.error('Account request failed. Check Spot Testnet credentials, permissions and IP restrictions.');
  process.exitCode = 1;
});
