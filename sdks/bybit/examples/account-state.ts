import { RestClientV5 } from 'bybit-api';

async function main() {
  if (process.env.BYBITTRACE) {
    throw new Error('Unset BYBITTRACE to keep signed requests out of logs.');
  }
  const key = process.env.BYBIT_API_KEY;
  const secret = process.env.BYBIT_API_SECRET;
  if (!key || !secret) {
    throw new Error('Set BYBIT_API_KEY and BYBIT_API_SECRET.');
  }

  const client = new RestClientV5({ key, secret, testnet: true });
  const response = await client.getWalletBalance({ accountType: 'UNIFIED' });
  if (response.retCode !== 0) {
    throw new Error(`Bybit ${response.retCode}: ${response.retMsg}`);
  }

  const account = response.result.list[0];
  if (!account) {
    throw new Error(
      'No unified account record was returned. Check the account type.',
    );
  }

  console.log('Account access verified.');
  console.log('Returned coin records:', account.coin.length);
}

main().catch(() => {
  console.error(
    'Account request failed. Check Testnet credentials, account type and permissions; leave BYBITTRACE unset.',
  );
  process.exitCode = 1;
});
