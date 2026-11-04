import process from 'node:process';
import { readPrice, watchPrice } from './price.js';

async function main() {
  console.log('BTC REST price:', await readPrice());
  let stop;
  try {
    const price = await new Promise((resolve, reject) => {
      stop = watchPrice(resolve, reject);
    });
    console.log('BTC WebSocket price:', price);
  } finally {
    stop?.();
    console.log('WebSocket closed.');
  }
}
main().catch(error => {
  console.error(error.message || String(error));
  process.exitCode = 1;
});
