import { RestClientV5 } from 'bybit-api';

async function main() {
  const client = new RestClientV5({ throwExceptions: true });
  const response = await client.getTickers({
    category: 'spot',
    symbol: 'BTCUSDT',
  });
  const ticker = response.result.list[0];
  if (!ticker) {
    throw new Error('BTCUSDT was not present in the ticker response.');
  }
  console.log('BTCUSDT last price:', ticker.lastPrice);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
