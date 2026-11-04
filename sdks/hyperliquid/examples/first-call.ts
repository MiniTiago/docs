import { RestClient } from '@siebly/hyperliquid-api';

async function main() {
  const client = new RestClient();
  const mids = await client.getAllMids();
  if (mids.BTC === undefined) {
    throw new Error('BTC was not present in the mid-price response.');
  }
  console.log('BTC mid price:', mids.BTC);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
