import { CBInternationalClient } from 'coinbase-api';

async function main() {
  const client = new CBInternationalClient();
  const instruments = await client.getInstruments();
  console.log(instruments);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
