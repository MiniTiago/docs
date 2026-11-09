import { SpotClient } from '@siebly/kraken-api';

function requiredEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

async function main() {
  const client = new SpotClient({
    apiKey: requiredEnvVar('KRAKEN_API_KEY'),
    apiSecret: requiredEnvVar('KRAKEN_API_SECRET'),
  });

  // Kraken validates this request without submitting an order to the market.
  const response = await client.submitOrder({
    pair: 'XBTUSD',
    type: 'buy',
    ordertype: 'limit',
    price: requiredEnvVar('KRAKEN_ORDER_PRICE'),
    volume: requiredEnvVar('KRAKEN_ORDER_VOLUME'),
    validate: true,
  });
  console.log('Validation result:', response.result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
