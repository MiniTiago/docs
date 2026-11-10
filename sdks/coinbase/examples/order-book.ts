import { CBAdvancedTradeClient } from 'coinbase-api';

async function main() {
  const client = new CBAdvancedTradeClient();
  const { pricebook } = await client.getPublicProductBook({
    product_id: 'BTC-USD',
    limit: 10,
  });
  console.log(pricebook);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
