import { SpotClient } from '@siebly/kraken-api';

const client = new SpotClient();
const response = await client.getTicker({ pair: 'XBTUSD' });
const ticker = Object.values(response.result)[0];
const price = ticker?.c[0];

if (!price) {
  throw new Error('No BTC/USD price was returned.');
}

console.log('BTC/USD REST price:', price);
