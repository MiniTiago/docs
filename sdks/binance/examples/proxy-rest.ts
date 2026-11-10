import { MainClient } from 'binance';

export const client = new MainClient(
  {},
  {
    proxy: { protocol: 'http', host: '127.0.0.1', port: 8080 },
    timeout: 20_000,
  },
);
