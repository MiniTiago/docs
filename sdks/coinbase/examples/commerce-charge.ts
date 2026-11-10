import { CBCommerceClient } from 'coinbase-api';

function requiredEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

async function main() {
  const apiKey = requiredEnvVar('COINBASE_COMMERCE_API_KEY');
  const client = new CBCommerceClient(
    { apiKey },
    { headers: { 'X-CC-Api-Key': apiKey } },
  );
  const response = await client.getCharge({
    charge_code_or_charge_id: requiredEnvVar('COINBASE_COMMERCE_CHARGE_ID'),
  });
  console.log(response);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
