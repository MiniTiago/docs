import { CBExchangeClient } from 'coinbase-api';

async function main() {
  const client = new CBExchangeClient();
  const ticker = await client.getProductTicker({ product_id: 'BTC-USD' });
  console.log(ticker);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
