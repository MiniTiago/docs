import { RestClientV5, WebsocketClient } from 'bybit-api';

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
