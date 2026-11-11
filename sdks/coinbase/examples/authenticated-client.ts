import { CBAdvancedTradeClient } from 'coinbase-api';

function requiredEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

export const client = new CBAdvancedTradeClient({
  apiKey: requiredEnvVar('COINBASE_API_KEY'),
  apiSecret: requiredEnvVar('COINBASE_API_SECRET'),
});
