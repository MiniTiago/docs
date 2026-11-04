import { WebsocketAPIClient } from '@siebly/hyperliquid-api';

async function main() {
  const client = new WebsocketAPIClient();
  client.on('exception', (event) => console.error(event));

  try {
    const mids = await client.getAllMids();
    console.log(mids.BTC);
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
