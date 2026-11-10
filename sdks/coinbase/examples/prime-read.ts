import { CBPrimeClient } from 'coinbase-api';

function requiredEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

async function main() {
  const client = new CBPrimeClient({
    apiKey: requiredEnvVar('COINBASE_PRIME_API_KEY'),
    apiSecret: requiredEnvVar('COINBASE_PRIME_API_SECRET'),
    apiPassphrase: requiredEnvVar('COINBASE_PRIME_API_PASSPHRASE'),
  });
  const response = await client.getPortfolios();
  console.log(response);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
