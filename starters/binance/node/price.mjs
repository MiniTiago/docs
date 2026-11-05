import { MainClient } from 'binance';

const client = new MainClient();
const ticker = await client.getSymbolPriceTicker({
  symbol: 'BTCUSDT',
});

if (Array.isArray(ticker)) {
  throw new Error('Expected a single-symbol ticker.');
}

const price = ticker.price;

if (!price) {
  throw new Error('No BTCUSDT price was returned.');
}

console.log('BTCUSDT REST price:', price);
