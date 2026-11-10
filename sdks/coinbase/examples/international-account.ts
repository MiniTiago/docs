import { CBInternationalClient } from 'coinbase-api';

function requiredEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

async function main() {
  const client = new CBInternationalClient({
    apiKey: requiredEnvVar('COINBASE_INTX_API_KEY'),
    apiSecret: requiredEnvVar('COINBASE_INTX_API_SECRET'),
    apiPassphrase: requiredEnvVar('COINBASE_INTX_API_PASSPHRASE'),
  });
  const portfolio = requiredEnvVar('COINBASE_INTX_PORTFOLIO');
  console.log(await client.getPortfolioBalances({ portfolio }));
  console.log(await client.getPortfolioPositions({ portfolio }));
  console.log(await client.getOpenOrders({ portfolio }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
