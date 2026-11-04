import { MainClient } from 'binance';

async function main() {
  const client = new MainClient();
  const result = await client.getSymbolPriceTicker({ symbol: 'BTCUSDT' });
  if (Array.isArray(result)) throw new Error('Expected a single-symbol ticker.');
  console.log('BTCUSDT last price:', result.price);
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Request failed. See the troubleshooting guide.');
  process.exitCode = 1;
});
