const { RestClient } = require('@siebly/hyperliquid-api');

async function main() {
  const client = new RestClient();
  const mids = await client.getAllMids();
  const price = mids.BTC;

  if (!price) {
    throw new Error('No BTC price was returned.');
  }

  console.log('BTC REST price:', price);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
