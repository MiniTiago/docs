import { MainClient } from 'binance';
import { readFileSync, writeFileSync } from 'node:fs';

const SCALE = BigInt('1000000000000000000');
function decimal(value: string | number): bigint {
  if (typeof value !== 'string') throw new Error('Expected a decimal string from the exchange.');
  if (!/^\d+(\.\d{1,18})?$/.test(value)) throw new Error('Use unsigned decimal strings, at most 18 decimal places.');
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(18, '0'));
}
function range(value: bigint, min: string | number, max: string | number, step: string | number) {
  const low = decimal(min), high = decimal(max), increment = decimal(step);
  if ((low > BigInt(0) && value < low) || (high > BigInt(0) && value > high) || (increment > BigInt(0) && value % increment !== BigInt(0))) {
    throw new Error('Price or quantity does not satisfy the current symbol filters.');
  }
}
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}.`);
  return value;
}
const pause = () => new Promise<void>(resolve => setTimeout(resolve, 1000));
const terminal = new Set(['FILLED', 'CANCELED', 'REJECTED', 'EXPIRED', 'EXPIRED_IN_MATCH']);

async function main() {
  if (process.env.BINANCE_TESTNET !== 'true') throw new Error('Set BINANCE_TESTNET=true to opt in to Spot Testnet.');
  const command = process.argv[2];
  if (!['place', 'status', 'cancel'].includes(command)) throw new Error('Choose place, status or cancel.');
  const api_key = required('BINANCE_TESTNET_API_KEY');
  const api_secret = required('BINANCE_TESTNET_API_SECRET');
  const receiptPath = required('BINANCE_ORDER_RECEIPT');
  const client = new MainClient({ api_key, api_secret, testnet: true, beautifyResponses: false }, { timeout: 10000 });
  let receipt: { environment: string; symbol: string; clientOrderId: string };

  if (command === 'place') {
    const symbol = required('BINANCE_SYMBOL');
    const side = required('BINANCE_SIDE');
    const price = required('BINANCE_PRICE');
    const quantity = required('BINANCE_QUANTITY');
    if (!/^[A-Z0-9]{2,30}$/.test(symbol) || (side !== 'BUY' && side !== 'SELL')) throw new Error('Use an uppercase Spot symbol and BUY or SELL.');
    const p = decimal(price), q = decimal(quantity);
    if (p <= BigInt(0) || q <= BigInt(0)) throw new Error('Price and quantity must be positive.');
    const info = await client.getExchangeInfo({ symbol });
    const instrument = info.symbols.find(item => item.symbol === symbol);
    if (!instrument || instrument.status !== 'TRADING' || !instrument.isSpotTradingAllowed || !instrument.orderTypes.includes('LIMIT_MAKER')) {
      throw new Error('Symbol must support Spot LIMIT_MAKER trading.');
    }
    if (!instrument.filters.some(f => f.filterType === 'PRICE_FILTER') || !instrument.filters.some(f => f.filterType === 'LOT_SIZE')) {
      throw new Error('Required symbol filters are missing.');
    }
    for (const filter of instrument.filters) {
      if (filter.filterType === 'PRICE_FILTER') range(p, filter.minPrice, filter.maxPrice, filter.tickSize);
      if (filter.filterType === 'LOT_SIZE') range(q, filter.minQty, filter.maxQty, filter.stepSize);
      if (filter.filterType === 'MIN_NOTIONAL' || filter.filterType === 'NOTIONAL') {
        if (p * q < decimal(filter.minNotional) * SCALE) throw new Error('Order is below minimum notional.');
        if (filter.filterType === 'NOTIONAL' && decimal(filter.maxNotional) > BigInt(0) && p * q > decimal(filter.maxNotional) * SCALE) {
          throw new Error('Order exceeds maximum notional.');
        }
      }
    }
    receipt = { environment: 'spot-testnet', symbol, clientOrderId: client.generateNewOrderId() };
    // Exclusive creation prevents rerunning place with the same receipt path.
    writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), { flag: 'wx', mode: 0o600, flush: true });
    console.log('Recorded order lookup:', receipt.symbol, receipt.clientOrderId);
    try {
      // The SDK types these fields as numbers but serializes strings unchanged.
      await client.submitNewOrder({ symbol, side, type: 'LIMIT_MAKER', price: price as unknown as number, quantity: quantity as unknown as number, newClientOrderId: receipt.clientOrderId });
      console.log('Submission acknowledged. Querying current status.');
    } catch {
      console.error('Submission did not return success. Do not place again; use status with this receipt to resolve the outcome.');
      process.exitCode = 1;
      return;
    }
  } else {
    receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
    if (receipt.environment !== 'spot-testnet' || !/^[A-Z0-9]{2,30}$/.test(receipt.symbol) || !/^[A-Za-z0-9_-]{1,36}$/.test(receipt.clientOrderId)) {
      throw new Error('Invalid Spot Testnet receipt.');
    }
  }
  const lookup = { symbol: receipt.symbol, origClientOrderId: receipt.clientOrderId };
  if (command === 'cancel') {
    // Read first: a completed order has no remaining quantity to cancel.
    const current = await client.getOrder(lookup);
    console.log('Before cancel:', current.status, 'executed quantity:', current.executedQty);
    if (terminal.has(current.status)) return;
    try {
      await client.cancelOrder(lookup);
      console.log('Cancellation acknowledged. Querying final status.');
    } catch {
      console.error('Cancellation did not return success; checking status without retrying the cancel.');
    }
  }
  // Bound reads; an absent order or failed read is not evidence of a rejected write.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const order = await client.getOrder(lookup);
      console.log('Order:', order.symbol, order.status, 'executed quantity:', order.executedQty);
      if (command !== 'cancel' || terminal.has(order.status)) return;
    } catch {
      console.error('Status unavailable.');
    }
    if (attempt < 2) await pause();
  }
  console.error('Outcome unresolved. Keep the receipt and run status again before any further write.');
  process.exitCode = 1;
}

main().catch(() => {
  console.error('Stopped. Check the command, Testnet variables, receipt path, current symbol filters and API permissions. No automatic write retry was made.');
  process.exitCode = 1;
});
