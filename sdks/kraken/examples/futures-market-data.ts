import { DerivativesClient } from '@siebly/kraken-api';

async function main() {
  const client = new DerivativesClient();
  const response = await client.getTickers();
  console.log(response.tickers);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
