@@IMPORT@@

const ws = @@WEBSOCKET@@;

ws.on('@@EVENT@@', (message) => {
@@UPDATE@@

  if (price) {
    console.log('@@SYMBOL@@ WebSocket price:', String(price));
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

@@SUBSCRIPTION@@;
