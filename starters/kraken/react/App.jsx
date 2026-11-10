import { useEffect, useState } from 'react';
import { SpotClient, WebsocketClient } from '@siebly/kraken-api';

function Prices() {
  const [restPrice, setRestPrice] = useState('Loading');
  const [livePrice, setLivePrice] = useState('Connecting');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const ws = new WebsocketClient();

    function showError(error) {
      console.error(error);
      if (mounted) {
        setError(error instanceof Error ? error.message : String(error));
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

      if (!price) {
        throw new Error('No price was returned.');
      }

      if (mounted) {
        setRestPrice(String(price));
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
        await Promise.resolve(ws.subscribe({ topic: 'ticker', payload: { symbol: ['BTC/USD'] } }, 'spotPublicV2'));
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
      <p>BTC/USD REST price: <output aria-label="REST price">{restPrice}</output></p>
      <p>BTC/USD WebSocket price: <output aria-label="WebSocket price">{livePrice}</output></p>
      <p role="alert">{error}</p>
    </section>
  );
}

export default function App({ pageActive = true }) {
  const [running, setRunning] = useState(true);

  return (
    <main>
      <h1>BTC/USD price</h1>
      {running && pageActive ? <Prices /> : <p>Stream stopped. WebSocket closed.</p>}
      <button type="button" onClick={() => setRunning(!running)}>
        {running ? 'Stop stream' : 'Start stream'}
      </button>
    </main>
  );
}
