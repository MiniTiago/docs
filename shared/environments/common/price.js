import * as sdk from '@@PACKAGE@@';
import * as market from './market.js';

function positivePrice(value) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
    throw new Error('The exchange did not return a positive BTC price.');
  }
  return String(value);
}

export async function readPrice() {
  return positivePrice(await market.read(market.client(sdk)));
}

// Returns cleanup immediately, including while subscription acknowledgement is pending.
export function watchPrice(onPrice, onError) {
  const ws = market.stream(sdk);
  let stopped = false;
  const receive = message => {
    const value = market.value(message);
    if (!stopped && value !== undefined) {
      clearTimeout(deadline);
      try { onPrice(positivePrice(value)); } catch (error) { fail(error); }
    }
  };
  const fail = error => { if (!stopped) onError(error); };
  const deadline = setTimeout(() => fail(new Error('No BTC update within 30 seconds. Check network access.')), 30000);
  ws.on(market.event, receive);
  ws.on('exception', fail);
  Promise.resolve(market.subscribe(ws)).catch(fail);
  return () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(deadline);
    ws.closeAll();
    ws.removeListener(market.event, receive);
    ws.removeListener('exception', fail);
  };
}
