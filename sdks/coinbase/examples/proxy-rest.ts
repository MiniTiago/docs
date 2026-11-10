import { CBAdvancedTradeClient } from 'coinbase-api';

export const client = new CBAdvancedTradeClient(
  {},
  {
    proxy: { protocol: 'http', host: '127.0.0.1', port: 8080 },
    timeout: 20000,
  },
);
