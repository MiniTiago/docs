import React, { useEffect, useState } from 'react';
import { Button, SafeAreaView, Text, View } from 'react-native';
import { CBAdvancedTradeClient, WebsocketClient } from 'coinbase-api';

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
      const client = new CBAdvancedTradeClient();
      const ticker = await client.getPublicProduct({ product_id: 'BTC-USD' });
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
      showError(new Error('No BTC-USD update within 30 seconds.'));
    }, 30_000);

    ws.on('update', (message) => {
      if (message.channel !== 'ticker') {
        console.log('WebSocket update:', message);
        return;
      }

      let price;
      for (const event of message.events ?? []) {
        for (const ticker of event.tickers ?? []) {
          if (ticker.product_id === 'BTC-USD') {
            price = ticker.price;
          }
        }
      }
      if (!price) {
        console.log('WebSocket update:', message);
      }

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
        await Promise.resolve(ws.subscribe({ topic: 'ticker', payload: { product_ids: ['BTC-USD'] } }, 'advTradeMarketData'));
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
      <Text>BTC-USD REST price: {restPrice}</Text>
      <Text>BTC-USD WebSocket price: {livePrice}</Text>
      <Text accessibilityRole="alert">{error}</Text>
    </View>
  );
}

export default function App() {
  const [running, setRunning] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 24 }}>BTC-USD price</Text>
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
