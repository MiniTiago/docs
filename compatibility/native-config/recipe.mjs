import { readFile } from 'node:fs/promises';

export function nativeMetroConfig(id) {
  const filename = { bybit: 'bybit.metro.cjs', binance: 'metro.cjs' }[id];
  if (!filename) {
    throw new Error(`No Metro polyfill recipe for ${id}.`);
  }

  return readFile(new URL(filename, import.meta.url), 'utf8');
}
