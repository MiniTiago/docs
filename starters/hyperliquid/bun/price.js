import { RestClient } from '@siebly/hyperliquid-api';

const client = new RestClient();
const mids = await client.getAllMids();
const price = mids.BTC;

if (!price) {
  throw new Error('No BTC price was returned.');
}

console.log('BTC REST price:', price);
