import { @@REST_CLIENT@@, WebsocketClient } from '@@PACKAGE@@';

const restOutput = document.querySelector('#rest');
const liveOutput = document.querySelector('#live');
const errorOutput = document.querySelector('#error');
const ws = @@WEBSOCKET@@;
let stopped = false;

function showError(error) {
  if (!stopped) {
    errorOutput.textContent = error instanceof Error ? error.message : String(error);
  }
}

async function loadPrice() {
@@REQUEST@@

  if (!stopped) {
    restOutput.textContent = String(price);
  }
}

loadPrice().catch(showError);

const timeout = setTimeout(() => {
  showError(new Error('No @@SYMBOL@@ update within 30 seconds.'));
}, 30_000);

ws.on('@@EVENT@@', (message) => {
@@UPDATE@@

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
    await @@SUBSCRIPTION@@;
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
