const { CBAdvancedTradeClient } = require('coinbase-api');

async function main() {
  const client = new CBAdvancedTradeClient();
  const ticker = await client.getPublicProduct({ product_id: 'BTC-USD' });
  const price = ticker.price;

  if (!price) {
    throw new Error('No BTC-USD price was returned.');
  }

  console.log('BTC-USD REST price:', price);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
