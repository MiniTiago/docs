import { WebsocketAPIClient } from 'coinbase-api';

async function main() {
  const client = new WebsocketAPIClient();
  try {
    const response = await client.getTime();
    console.log(response.result);
  } finally {
    client.getWSClient().closeAll();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
