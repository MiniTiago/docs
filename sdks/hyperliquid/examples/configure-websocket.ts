import { WebsocketAPIClient } from '@siebly/hyperliquid-api';

async function main() {
  const client = new WebsocketAPIClient({
    testnet: true,
    connectionTimeout: 5_000,
    requestTimeoutMs: 20_000,
  });
  client.on('exception', console.error);

  try {
    console.log(await client.getAllMids());
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
