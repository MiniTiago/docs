import { RestClientV5 } from 'bybit-api';

async function main() {
  const client = new RestClientV5();
  const response = await client.getOrderbook({ category: 'spot', symbol: 'BTCUSDT', limit: 5 });
  if (response.retCode !== 0) throw new Error(`Bybit ${response.retCode}: ${response.retMsg}`);
  console.log('Best bid [price, size]:', response.result.b[0]);
  console.log('Best ask [price, size]:', response.result.a[0]);
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Request failed. See the troubleshooting guide.');
  process.exitCode = 1;
});
