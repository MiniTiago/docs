import { RestClient } from '@siebly/hyperliquid-api';

const client = new RestClient(
  { testnet: true },
  { timeout: 20_000 },
);

client.getAllMids().then(console.log).catch(console.error);
