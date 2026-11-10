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
  const account_id = requiredEnvVar('COINBASE_APP_ACCOUNT_ID');
  const response = await client.getTransactions({ account_id });
  console.log(response.data);
  console.log('Pagination:', response.pagination);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
