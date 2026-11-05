import { MainClient, WebsocketClient } from 'binance';

const restOutput = document.querySelector('#rest');
const liveOutput = document.querySelector('#live');
const errorOutput = document.querySelector('#error');
const ws = new WebsocketClient({});
let stopped = false;

function showError(error) {
  if (!stopped) {
    errorOutput.textContent = error instanceof Error ? error.message : String(error);
  }
}

async function loadPrice() {
  const client = new MainClient();
  const ticker = await client.getSymbolPriceTicker({
    symbol: 'BTCUSDT',
  });

  if (Array.isArray(ticker)) {
    throw new Error('Expected a single-symbol ticker.');
  }

  const price = ticker.price;

  if (!stopped) {
    restOutput.textContent = String(price);
  }
}

loadPrice().catch(showError);

const timeout = setTimeout(() => {
  showError(new Error('No BTCUSDT update within 30 seconds.'));
}, 30_000);

ws.on('message', (message) => {
  if (message.e !== '24hrTicker') {
    return;
  }

  const price = message.c;

  if (!stopped && price) {
    clearTimeout(timeout);
    liveOutput.textContent = String(price);
  }
});
ws.on('exception', showError);

Promise.resolve().then(async () => {
  if (stopped) {
    return;
  }

  try {
    await ws.subscribeSpotSymbol24hrTicker('btcusdt');
  } finally {
    if (stopped) {
      ws.closeAll();
    }
  }
}).catch(showError);

function stop() {
  if (stopped) {
    return;
  }

  stopped = true;
  clearTimeout(timeout);
  ws.closeAll();
  liveOutput.textContent = 'Stopped';
}

document.querySelector('#stop').addEventListener('click', stop);
window.addEventListener('pagehide', stop, { once: true });

if (import.meta.hot) {
  import.meta.hot.dispose(stop);
}
