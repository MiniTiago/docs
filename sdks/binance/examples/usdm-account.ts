import { USDMClient } from 'binance';

async function main() {
  const api_key = process.env.BINANCE_API_KEY;
  const api_secret = process.env.BINANCE_API_SECRET;
  if (!api_key || !api_secret) {
    throw new Error('Set BINANCE_API_KEY and BINANCE_API_SECRET.');
  }

  const client = new USDMClient({ api_key, api_secret, demoTrading: true });
  const account = await client.getAccountInformationV3();
  console.log('Account:', {
    canTrade: account.canTrade,
    walletBalance: account.totalWalletBalance,
    availableBalance: account.availableBalance,
  });

  console.log('Balances:', await client.getBalanceV3());
  console.log(
    'BTCUSDT positions:',
    await client.getPositionsV3({ symbol: 'BTCUSDT' }),
  );

  const positionMode = await client.getCurrentPositionMode();
  console.log(
    'Position mode:',
    positionMode.dualSidePosition ? 'Hedge' : 'One-way',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
