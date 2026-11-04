import { RestClient } from '@siebly/hyperliquid-api';

async function main() {
  const client = new RestClient();
  const candles = await client.getCandles({
    coin: 'BTC',
    interval: '1h',
    startTime: Date.now() - 24 * 60 * 60 * 1000,
  });
  console.log(candles);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
