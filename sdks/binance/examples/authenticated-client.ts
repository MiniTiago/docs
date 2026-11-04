import { MainClient } from 'binance';

const api_key = process.env.BINANCE_API_KEY;
const api_secret = process.env.BINANCE_API_SECRET;
if (!api_key || !api_secret) throw new Error('Set BINANCE_API_KEY and BINANCE_API_SECRET.');

export const client = new MainClient({ api_key, api_secret, testnet: true });
