import { MainClient } from 'binance';

export const client = new MainClient(
  { testnet: true, recvWindow: 5000 },
  { timeout: 10000 },
);
