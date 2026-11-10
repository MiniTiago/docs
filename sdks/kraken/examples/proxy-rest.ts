import { SpotClient } from '@siebly/kraken-api';

export const client = new SpotClient(
  {},
  {
    proxy: { protocol: 'http', host: '127.0.0.1', port: 8080 },
    timeout: 20_000,
  },
);
