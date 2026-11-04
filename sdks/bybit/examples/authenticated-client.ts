import { RestClientV5 } from 'bybit-api';

const key = process.env.BYBIT_API_KEY;
const secret = process.env.BYBIT_API_SECRET;
if (!key || !secret) throw new Error('Set BYBIT_API_KEY and BYBIT_API_SECRET.');

export const client = new RestClientV5({ key, secret, testnet: true });
