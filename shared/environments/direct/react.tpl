import { useEffect, useState } from 'react';
import { @@REST_CLIENT@@, WebsocketClient } from '@@PACKAGE@@';

function Prices() {
  const [restPrice, setRestPrice] = useState('Loading');
  const [livePrice, setLivePrice] = useState('Connecting');
  const [error, setError] = useState('');

@@EFFECT@@

  return (
    <section>
      <p>@@SYMBOL@@ REST price: <output aria-label="REST price">{restPrice}</output></p>
      <p>@@SYMBOL@@ WebSocket price: <output aria-label="WebSocket price">{livePrice}</output></p>
      <p role="alert">{error}</p>
    </section>
  );
}

export default function App({ pageActive = true }) {
  const [running, setRunning] = useState(true);

  return (
    <main>
      <h1>@@SYMBOL@@ price</h1>
      {running && pageActive ? <Prices /> : <p>Stream stopped. WebSocket closed.</p>}
      <button type="button" onClick={() => setRunning(!running)}>
        {running ? 'Stop stream' : 'Start stream'}
      </button>
    </main>
  );
}
