const { RestClientV5 } = require('bybit-api');

async function main() {
  const client = new RestClientV5();
  const response = await client.getTickers({
    category: 'spot',
    symbol: 'BTCUSDT',
  });

  if (response.retCode !== 0) {
    throw new Error(response.retMsg);
  }

  const price = response.result.list[0]?.lastPrice;

  if (!price) {
    throw new Error('No BTCUSDT price was returned.');
  }

  console.log('BTCUSDT REST price:', price);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
