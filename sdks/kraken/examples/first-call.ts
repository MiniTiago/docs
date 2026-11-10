import { SpotClient } from '@siebly/kraken-api';

async function main() {
  const client = new SpotClient();
  const response = await client.getTicker({ pair: 'XBTUSD' });

  for (const [pair, ticker] of Object.entries(response.result)) {
    console.log(`${pair} last price: ${ticker.c[0]}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
