import { RestClientV5 } from 'bybit-api';

export const client = new RestClientV5(
  {},
  {
    proxy: { protocol: 'http', host: '127.0.0.1', port: 8080 },
    timeout: 20_000,
  },
);
