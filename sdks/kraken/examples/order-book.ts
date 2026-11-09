import { SpotClient } from '@siebly/kraken-api';

async function main() {
  const client = new SpotClient();
  const response = await client.getOrderBook({ pair: 'XBTUSD', count: 10 });

  for (const [pair, book] of Object.entries(response.result)) {
    console.log(pair, { bids: book.bids, asks: book.asks });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
