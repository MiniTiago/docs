import React, { useEffect, useState } from 'react';
import { readPrice, watchPrice } from './price.js';

function Prices() {
  const [rest, setRest] = useState('Loading');
  const [live, setLive] = useState('Connecting');
  const [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    const fail = value => { if (mounted) setError(value instanceof Error ? value.message : String(value)); };
    readPrice().then(price => { if (mounted) setRest(price); }).catch(fail);
    const stop = watchPrice(price => { if (mounted) setLive(price); }, fail);
    return () => { mounted = false; stop(); };
  }, []);
  return <section>
    <p>BTC REST price: <output aria-label="REST price">{rest}</output></p>
    <p>BTC WebSocket price: <output aria-label="WebSocket price">{live}</output></p>
    <p role="alert">{error}</p>
  </section>;
}

export default function App() {
  const [running, setRunning] = useState(true);
  return <main>
    <h1>BTC price</h1>
    {running ? <Prices /> : <p>Stream stopped. WebSocket closed.</p>}
    <button type="button" onClick={() => setRunning(value => !value)}>{running ? 'Stop stream' : 'Start stream'}</button>
  </main>;
}
