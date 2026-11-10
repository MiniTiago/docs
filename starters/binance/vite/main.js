import { MainClient, WebsocketClient } from 'binance';

const restOutput = document.querySelector('#rest');
const liveOutput = document.querySelector('#live');
const errorOutput = document.querySelector('#error');
const stopButton = document.querySelector('#stop');
let stopStream;
let userStopped = false;

function startStream() {
  const ws = new WebsocketClient({});
  let stopped = false;
  liveOutput.textContent = 'Connecting';
  errorOutput.textContent = '';

  function showError(error) {
    console.error(error);
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

  return function stop() {
    if (stopped) {
      return;
    }

    stopped = true;
    clearTimeout(timeout);
    ws.closeAll();
    liveOutput.textContent = 'Stopped';
  };
}

function start() {
  if (!stopStream && !userStopped) {
    stopStream = startStream();
  }
}

function stop() {
  stopStream?.();
  stopStream = undefined;
}

function stopByUser() {
  userStopped = true;
  stop();
}

function restore(event) {
  if (event.persisted) {
    start();
  }
}

stopButton.addEventListener('click', stopByUser);
window.addEventListener('pagehide', stop);
window.addEventListener('pageshow', restore);
start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopButton.removeEventListener('click', stopByUser);
    window.removeEventListener('pagehide', stop);
    window.removeEventListener('pageshow', restore);
    stop();
  });
}
