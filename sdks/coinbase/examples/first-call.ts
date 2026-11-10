import { CBAdvancedTradeClient } from 'coinbase-api';

async function main() {
  const client = new CBAdvancedTradeClient();
  const product = await client.getPublicProduct({ product_id: 'BTC-USD' });
  console.log(`${product.product_id} price: ${product.price}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
