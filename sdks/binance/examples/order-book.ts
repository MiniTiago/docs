import { MainClient } from 'binance';

async function main() {
  const client = new MainClient();
  const book = await client.getOrderBook({ symbol: 'BTCUSDT', limit: 5 });
  console.log('Best bid [price, quantity]:', book.bids[0]);
  console.log('Best ask [price, quantity]:', book.asks[0]);
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Request failed. See the troubleshooting guide.');
  process.exitCode = 1;
});
