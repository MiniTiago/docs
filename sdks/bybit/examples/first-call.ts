import { RestClientV5 } from 'bybit-api';

async function main() {
  const client = new RestClientV5();
  const response = await client.getTickers({ category: 'spot', symbol: 'BTCUSDT' });
  if (response.retCode !== 0) {
    throw new Error(`Bybit ${response.retCode}: ${response.retMsg}`);
  }
  const ticker = response.result.list[0];
  if (!ticker) throw new Error('BTCUSDT was not present in the ticker response.');
  console.log('BTCUSDT last price:', ticker.lastPrice);
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Request failed. See the troubleshooting guide.');
  process.exitCode = 1;
});
