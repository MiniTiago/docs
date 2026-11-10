import { WebsocketClient, WS_KEY_MAP } from 'coinbase-api';

function requiredEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

const ws = new WebsocketClient({
  apiKey: requiredEnvVar('COINBASE_API_KEY'),
  apiSecret: requiredEnvVar('COINBASE_API_SECRET').replace(/\\n/g, '\n'),
});

ws.on('update', (event) => {
  console.log(event);
});
ws.on('response', (event) => {
  console.log('Subscription response:', event);
});
ws.on('exception', (error) => {
  console.error('WebSocket exception:', error);
});
ws.on('reconnect', (event) => {
  console.log('Reconnecting:', event);
});
ws.on('reconnected', (event) => {
  console.log('Reconnected:', event);
});

// Observe all available user orders; this example does not submit orders.
ws.subscribe(['user', 'heartbeats'], WS_KEY_MAP.advTradeUserData);

function stop() {
  ws.closeAll();
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
