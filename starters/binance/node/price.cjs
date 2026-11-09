const { MainClient } = require('binance');

async function main() {
  const client = new MainClient();
  const ticker = await client.getSymbolPriceTicker({
    symbol: 'BTCUSDT',
  });

  if (Array.isArray(ticker)) {
    throw new Error('Expected a single-symbol ticker.');
  }

  const price = ticker.price;

  if (!price) {
    throw new Error('No BTCUSDT price was returned.');
  }

  console.log('BTCUSDT REST price:', price);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
