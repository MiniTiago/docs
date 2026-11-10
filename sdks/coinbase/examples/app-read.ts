import { CBAppClient } from 'coinbase-api';

function requiredEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

async function main() {
  const client = new CBAppClient({
    apiKey: requiredEnvVar('COINBASE_APP_API_KEY'),
    apiSecret: requiredEnvVar('COINBASE_APP_API_SECRET'),
  });
  const response = await client.getAccounts();
  console.log(response);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
