import { RestClient } from '@siebly/hyperliquid-api';

export const client = new RestClient(
  {},
  {
    proxy: { protocol: 'http', host: '127.0.0.1', port: 8080 },
    timeout: 20_000,
  },
);
