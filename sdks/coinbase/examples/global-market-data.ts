import { CBAdvancedTradeGlobalClient } from 'coinbase-api';

async function main() {
  const client = new CBAdvancedTradeGlobalClient();
  const instruments = await client.getInstruments({ currency: 'BTC' });
  console.log(instruments);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
