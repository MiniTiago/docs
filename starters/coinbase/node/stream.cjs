const { WebsocketClient } = require('coinbase-api');
const process = require('node:process');

const ws = new WebsocketClient();

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

  if (price) {
    console.log('BTC-USD WebSocket price:', String(price));
  }
});

ws.on('response', (message) => {
  console.log('WebSocket response:', message);
});
ws.on('exception', (error) => {
  console.error('WebSocket exception:', error);
});
ws.on('reconnect', (event) => {
  console.log('WebSocket reconnecting:', event);
});
ws.on('reconnected', (event) => {
  console.log('WebSocket reconnected:', event);
});

function stop() {
  ws.closeAll();
  console.log('WebSocket closed.');
}

process.once('SIGINT', stop);
process.once('SIGTERM', stop);

ws.subscribe({ topic: 'ticker', payload: { product_ids: ['BTC-USD'] } }, 'advTradeMarketData');
