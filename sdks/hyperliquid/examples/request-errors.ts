import { HyperliquidApiError, RestClient } from '@siebly/hyperliquid-api';

async function main() {
  const client = new RestClient();

  try {
    const mids = await client.getAllMids();
    console.log(mids.BTC);
  } catch (error) {
    if (error instanceof HyperliquidApiError) {
      console.error(error.message);
      console.error('HTTP status:', error.status);
      console.error('Transport code:', error.code);
      return;
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
