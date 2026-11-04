import { RestClientV5 } from 'bybit-api';

export const client = new RestClientV5(
  { testnet: true, recv_window: 5000, parseAPIRateLimits: true },
  { timeout: 10000 },
);
