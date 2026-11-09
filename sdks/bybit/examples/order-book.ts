import { RestClientV5 } from 'bybit-api';

async function main() {
  const client = new RestClientV5({ throwExceptions: true });
  const response = await client.getOrderbook({
    category: 'spot',
    symbol: 'BTCUSDT',
    limit: 5,
  });
  console.log('Best bid [price, size]:', response.result.b[0]);
  console.log('Best ask [price, size]:', response.result.a[0]);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
