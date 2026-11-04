import { RestClient } from '@siebly/hyperliquid-api';

async function main() {
  const client = new RestClient();
  const book = await client.getOrderBook({ coin: 'BTC' });
  if (!book) {
    console.log('No order book was returned for BTC.');
    return;
  }

  const [bids, asks] = book.levels;
  console.log({ bestBid: bids[0] ?? null, bestAsk: asks[0] ?? null });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
