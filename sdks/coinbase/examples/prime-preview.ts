import { CBPrimeClient } from 'coinbase-api';

function requiredEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

async function main() {
  const client = new CBPrimeClient({
    apiKey: requiredEnvVar('COINBASE_PRIME_API_KEY'),
    apiSecret: requiredEnvVar('COINBASE_PRIME_API_SECRET'),
    apiPassphrase: requiredEnvVar('COINBASE_PRIME_API_PASSPHRASE'),
  });
  const preview = await client.getOrderPreview({
    portfolio_id: requiredEnvVar('COINBASE_PRIME_PORTFOLIO_ID'),
    product_id: 'BTC-USD',
    side: 'BUY',
    type: 'MARKET',
    quote_value: '100',
  });
  console.log(preview);
  console.log('Preview only. No order was submitted.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
