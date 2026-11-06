import { RestClientV5 } from 'bybit-api';
import { randomUUID } from 'node:crypto';
import { closeSync, fsyncSync, openSync, readFileSync, writeFileSync } from 'node:fs';

// Run only on a trusted Node.js server, never in a browser.
class GuideError extends Error {}
const SCALE = BigInt('1000000000000000000');
function decimal(value: string): bigint {
  if (!/^\d+(\.\d{1,18})?$/.test(value)) throw new GuideError('Use positive decimal strings, not exponent notation.');
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(18, '0'));
}
function positive(value: string): bigint {
  const result = decimal(value);
  if (result <= BigInt(0)) throw new GuideError('Price, quantity and cap must be positive.');
  return result;
}
function checked<T>(response: { retCode: number; result: T }): T {
  if (response.retCode !== 0) throw new GuideError(`Exchange rejected request (retCode ${response.retCode}).`);
  return response.result;
}
const terminal = new Set(['Filled', 'Cancelled', 'Rejected', 'PartiallyFilledCanceled', 'Deactivated']);

async function main() {
  if (process.env.BYBITTRACE) throw new GuideError('Unset BYBITTRACE to avoid logging signed request headers.');
  if (process.env.BYBIT_TESTNET_ORDERS !== 'I_UNDERSTAND') {
    throw new GuideError('Set BYBIT_TESTNET_ORDERS=I_UNDERSTAND to enable Testnet orders.');
  }
  const key = process.env.BYBIT_API_KEY;
  const secret = process.env.BYBIT_API_SECRET;
  if (!key?.trim() || !secret?.trim() || key.includes('replace_') || secret.includes('replace_')) {
    throw new GuideError('Set real Testnet BYBIT_API_KEY and BYBIT_API_SECRET values.');
  }
  const mode = process.env.BYBIT_ORDER_MODE || 'create';
  if (!['create', 'recover'].includes(mode)) throw new GuideError('Mode must be create or recover.');
  const file = 'bybit-testnet-order.json';
  const client = new RestClientV5({ key, secret, testnet: true, throwExceptions: false }, { timeout: 10000 });
  const category = 'linear' as const;
  const symbol = 'BTCUSDT';
  let orderLinkId: string;
  if (mode === 'recover') {
    const saved = JSON.parse(readFileSync(file, 'utf8'));
    if (saved.testnet !== true || saved.category !== category || saved.symbol !== symbol ||
        !/^docs-[a-f0-9]{30}$/.test(saved.orderLinkId)) throw new GuideError('Invalid recovery record.');
    orderLinkId = saved.orderLinkId;
  } else {
    const price = process.env.BYBIT_LIMIT_PRICE || '';
    const qty = process.env.BYBIT_ORDER_QTY || '';
    const cap = process.env.BYBIT_MAX_NOTIONAL_USDT || '';
    const p = positive(price), q = positive(qty), max = positive(cap);
    if (p * q > max * SCALE) throw new GuideError('Order exceeds your notional cap.');
    const instrument = checked(await client.getInstrumentsInfo({ category, symbol })).list[0];
    if (!instrument || instrument.symbol !== symbol || instrument.status !== 'Trading' ||
        instrument.contractType !== 'LinearPerpetual') throw new GuideError('Expected a trading BTCUSDT perpetual.');
    const pf = instrument.priceFilter, lf = instrument.lotSizeFilter;
    if (p % positive(pf.tickSize) !== BigInt(0) || p < positive(pf.minPrice) || p > positive(pf.maxPrice) ||
        q % positive(lf.qtyStep) !== BigInt(0) || q < positive(lf.minOrderQty) || q > positive(lf.maxOrderQty) ||
        !lf.minNotionalValue || p * q < decimal(lf.minNotionalValue) * SCALE) {
      throw new GuideError('Price or quantity violates current instrument filters. Review tickSize, qtyStep and minimum notional.');
    }
    const book = checked(await client.getOrderbook({ category, symbol, limit: 1 }));
    if (!book.b[0] || p >= positive(book.b[0][0])) throw new GuideError('Choose a buy price below the current best bid.');
    orderLinkId = `docs-${randomUUID().replace(/-/g, '').slice(0, 30)}`;
    // Exclusive creation prevents accidentally creating a second order on rerun.
    let fd: number;
    try { fd = openSync(file, 'wx', 0o600); } catch {
      throw new GuideError('Cannot create receipt. Keep any existing receipt and use recover mode; otherwise check directory permissions.');
    }
    try {
      writeFileSync(fd, JSON.stringify({ testnet: true, category, symbol, orderLinkId, price, qty }, null, 2));
      fsyncSync(fd);
    } finally { closeSync(fd); }
    console.log('Saved orderLinkId:', orderLinkId);
    try {
      const response = await client.submitOrder({ category, symbol, side: 'Buy', orderType: 'Limit',
        price, qty, timeInForce: 'PostOnly', positionIdx: 0, orderLinkId });
      if (response.retCode !== 0) {
        console.error('Submit returned retCode:', response.retCode, 'Reconciling the saved ID.');
      } else {
        console.log('Submission acknowledged; checking actual order status.');
      }
    } catch {
      console.error('Submission outcome unknown. No resubmission; reconciling the saved ID.');
    }
  }

  const query = { category, symbol, orderLinkId };
  let cancelAttempted = false;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      // Query by ID includes recent closed orders; openOnly is ignored for this lookup.
      let order = checked(await client.getActiveOrders(query)).list.find(o => o.orderLinkId === orderLinkId);
      if (!order) order = checked(await client.getHistoricOrders(query)).list.find(o => o.orderLinkId === orderLinkId);
      if (order) {
        console.log({ orderLinkId, orderStatus: order.orderStatus, cumExecQty: order.cumExecQty, leavesQty: order.leavesQty });
        if (terminal.has(order.orderStatus)) {
          if (decimal(order.cumExecQty) > BigInt(0)) console.log('A fill occurred. Review your Testnet position; cancellation does not reverse fills.');
          if (order.orderStatus === 'Rejected') process.exitCode = 1;
          return;
        }
        if (!cancelAttempted && ['New', 'PartiallyFilled'].includes(order.orderStatus)) {
          cancelAttempted = true; // Never retry a cancellation blindly after a timeout.
          try {
            const response = await client.cancelOrder(query);
            console.log('Cancellation response retCode:', response.retCode, 'Checking actual order status.');
          } catch {
            console.error('Cancellation outcome unknown; continuing read-only reconciliation.');
          }
        }
      }
    } catch {
      console.error('Status query failed; next bounded read will reconcile the same ID.');
    }
    if (attempt < 9) await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new GuideError('Outcome unresolved. Keep the saved ID and inspect Testnet orders/history/positions before any new order.');
}
main().catch(error => {
  // Never print raw SDK errors or request objects.
  console.error(error instanceof GuideError ? error.message : 'Request failed. Check Testnet configuration.');
  process.exitCode = 1;
});
