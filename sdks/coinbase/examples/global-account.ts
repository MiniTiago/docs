import { CBAdvancedTradeGlobalClient } from 'coinbase-api';

function requiredEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

async function main() {
  const client = new CBAdvancedTradeGlobalClient({
    apiKey: requiredEnvVar('COINBASE_GLOBAL_API_KEY'),
    apiSecret: requiredEnvVar('COINBASE_GLOBAL_API_SECRET'),
  });
  const summary = await client.getAccountSummary({ currency: 'USDC' });
  console.log(summary);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
