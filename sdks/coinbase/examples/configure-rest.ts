import { CBAdvancedTradeClient } from 'coinbase-api';

export const client = new CBAdvancedTradeClient(
  { keepAlive: true, strictParamValidation: true },
  { timeout: 10000 },
);
