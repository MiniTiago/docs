import { useEffect, useState } from 'react';
import { RestClientV5, WebsocketClient } from 'bybit-api';

function Prices() {
  const [restPrice, setRestPrice] = useState('Loading');
  const [livePrice, setLivePrice] = useState('Connecting');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const ws = new WebsocketClient({});

    function showError(error) {
      console.error(error);
      if (mounted) {
        setError(error instanceof Error ? error.message : String(error));
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

      if (!price) {
        throw new Error('No price was returned.');
      }

      if (mounted) {
        setRestPrice(String(price));
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

      if (mounted && price) {
        clearTimeout(timeout);
        setLivePrice(String(price));
      }
    });
    ws.on('exception', showError);

    // React can clean up an effect before its subscription starts.
    Promise.resolve().then(async () => {
      if (!mounted) {
        return;
      }

      try {
        await Promise.all(ws.subscribeV5('tickers.BTCUSDT', 'spot'));
      } finally {
        // Close again if pending setup completed after unmount.
        if (!mounted) {
          ws.closeAll();
        }
      }
    }).catch(showError);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      ws.closeAll();
    };
  }, []);

  return (
    <section>
      <p>BTCUSDT REST price: <output aria-label="REST price">{restPrice}</output></p>
      <p>BTCUSDT WebSocket price: <output aria-label="WebSocket price">{livePrice}</output></p>
      <p role="alert">{error}</p>
    </section>
  );
}

export default function App({ pageActive = true }) {
  const [running, setRunning] = useState(true);

  return (
    <main>
      <h1>BTCUSDT price</h1>
      {running && pageActive ? <Prices /> : <p>Stream stopped. WebSocket closed.</p>}
      <button type="button" onClick={() => setRunning(!running)}>
        {running ? 'Stop stream' : 'Start stream'}
      </button>
    </main>
  );
}
