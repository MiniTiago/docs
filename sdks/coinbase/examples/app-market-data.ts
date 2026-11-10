import { CBAppClient } from 'coinbase-api';

async function main() {
  const client = new CBAppClient();
  const response = await client.getSpotPrice({ currencyPair: 'BTC-USD' });
  console.log(response.data);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
