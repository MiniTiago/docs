import { SpotClient, WebsocketClient } from '@siebly/kraken-api';

const restOutput = document.querySelector('#rest');
const liveOutput = document.querySelector('#live');
const errorOutput = document.querySelector('#error');
const stopButton = document.querySelector('#stop');
let stopStream;
let userStopped = false;

function startStream() {
  const ws = new WebsocketClient();
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
    // Public GET requests only. Keep credentials on your server.
    const client = new SpotClient({}, {
      transformRequest: [function (data, headers) {
        if (this.method !== 'get') {
          throw new Error('This browser client supports public GET requests only.');
        }
        // These SDK defaults trigger a preflight Kraken does not accept.
        headers.delete('UserAgent');
        headers.delete('locale');
        return data;
      }],
    });
    const response = await client.getTicker({ pair: 'XBTUSD' });
    const ticker = Object.values(response.result)[0];
    const price = ticker?.c[0];

    if (!stopped) {
      restOutput.textContent = String(price);
    }
  }

  loadPrice().catch(showError);

  const timeout = setTimeout(() => {
    showError(new Error('No BTC/USD update within 30 seconds.'));
  }, 30_000);

  ws.on('message', (message) => {
    if (message.channel !== 'ticker') {
      console.log('WebSocket message:', message);
      return;
    }

    const price = message.data?.[0]?.last;

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
      await Promise.resolve(ws.subscribe({ topic: 'ticker', payload: { symbol: ['BTC/USD'] } }, 'spotPublicV2'));
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
