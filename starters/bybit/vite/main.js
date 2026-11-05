import { RestClientV5, WebsocketClient } from 'bybit-api';

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
  const client = new RestClientV5();
  const response = await client.getTickers({
    category: 'spot',
    symbol: 'BTCUSDT',
  });

  if (response.retCode !== 0) {
    throw new Error(response.retMsg);
  }

  const price = response.result.list[0]?.lastPrice;

  if (!stopped) {
    restOutput.textContent = String(price);
  }
}

loadPrice().catch(showError);

const timeout = setTimeout(() => {
  showError(new Error('No BTCUSDT update within 30 seconds.'));
}, 30_000);

ws.on('update', (message) => {
  if (message.topic !== 'tickers.BTCUSDT') {
    return;
  }

  const price = message.data?.lastPrice;

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
    await Promise.all(ws.subscribeV5('tickers.BTCUSDT', 'spot'));
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
