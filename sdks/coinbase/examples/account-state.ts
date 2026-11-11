import { client } from './authenticated-client.js';

async function main() {
  const permissions = await client.getApiKeyPermissions();
  console.log(permissions);

  const accounts = await client.getAccounts({ limit: 100 });
  for (const account of accounts.accounts) {
    console.log(account.currency, {
      available: account.available_balance.value,
      held: account.hold.value,
    });
  }
  console.log('More pages:', accounts.has_next);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
