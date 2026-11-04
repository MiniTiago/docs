import { RestClient } from '@siebly/hyperliquid-api';

async function main() {
  const client = new RestClient({ testnet: true });
  const mids = await client.getAllMids();
  console.log(mids.BTC);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
