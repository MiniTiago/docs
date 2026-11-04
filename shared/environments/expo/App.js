import React, { useEffect, useState } from 'react';
import { Button, SafeAreaView, Text, View } from 'react-native';
import { readPrice, watchPrice } from './price.js';

function Prices() {
  const [rest, setRest] = useState('Loading');
  const [live, setLive] = useState('Connecting');
  const [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    const fail = value => { if (mounted) setError(value.message || String(value)); };
    readPrice().then(price => { if (mounted) setRest(price); }).catch(fail);
    const stop = watchPrice(price => { if (mounted) setLive(price); }, fail);
    return () => { mounted = false; stop(); };
  }, []);
  return <View style={{ gap: 12, paddingVertical: 24 }}>
    <Text>BTC REST price: {rest}</Text>
    <Text>BTC WebSocket price: {live}</Text>
    <Text accessibilityRole="alert">{error}</Text>
  </View>;
}

export default function App() {
  const [running, setRunning] = useState(true);
  return <SafeAreaView style={{ flex: 1 }}><View style={{ padding: 24 }}>
    <Text style={{ fontSize: 24 }}>BTC price</Text>
    {running ? <Prices /> : <Text style={{ paddingVertical: 24 }}>Stream stopped. WebSocket closed.</Text>}
    <Button title={running ? 'Stop stream' : 'Start stream'} onPress={() => setRunning(value => !value)} />
  </View></SafeAreaView>;
}
