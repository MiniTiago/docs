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
  const portfolio_id = requiredEnvVar('COINBASE_PRIME_PORTFOLIO_ID');
  const balances = await client.getPortfolioBalances({
    portfolio_id,
    balance_type: 'TRADING_BALANCES',
  });
  console.log(balances);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
