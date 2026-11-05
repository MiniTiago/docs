import React, { useEffect, useState } from 'react';
import { Button, SafeAreaView, Text, View } from 'react-native';
import { MainClient, WebsocketClient } from 'binance';

function Prices() {
  const [restPrice, setRestPrice] = useState('Loading');
  const [livePrice, setLivePrice] = useState('Connecting');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const ws = new WebsocketClient({});

    function showError(error) {
      if (mounted) {
        setError(error instanceof Error ? error.message : String(error));
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

    ws.on('message', (message) => {
      if (message.e !== '24hrTicker') {
        return;
      }

      const price = message.c;

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
        await ws.subscribeSpotSymbol24hrTicker('btcusdt');
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
    <View style={{ gap: 12, paddingVertical: 24 }}>
      <Text>BTCUSDT REST price: {restPrice}</Text>
      <Text>BTCUSDT WebSocket price: {livePrice}</Text>
      <Text accessibilityRole="alert">{error}</Text>
    </View>
  );
}

export default function App() {
  const [running, setRunning] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 24 }}>BTCUSDT price</Text>
        {running ? (
          <Prices />
        ) : (
          <Text style={{ paddingVertical: 24 }}>
            Stream stopped. WebSocket closed.
          </Text>
        )}
        <Button
          title={running ? 'Stop stream' : 'Start stream'}
          onPress={() => setRunning(!running)}
        />
      </View>
    </SafeAreaView>
  );
}
