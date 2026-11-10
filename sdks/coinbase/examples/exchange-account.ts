import { CBExchangeClient } from 'coinbase-api';

function requiredEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

async function main() {
  const client = new CBExchangeClient({
    apiKey: requiredEnvVar('COINBASE_EXCHANGE_API_KEY'),
    apiSecret: requiredEnvVar('COINBASE_EXCHANGE_API_SECRET'),
    apiPassphrase: requiredEnvVar('COINBASE_EXCHANGE_API_PASSPHRASE'),
  });
  const accounts = await client.getAccounts();
  console.log(accounts);
  const orders = await client.getOrders();
  console.log(orders);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
