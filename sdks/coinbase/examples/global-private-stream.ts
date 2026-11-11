import { WebsocketClient, WS_KEY_MAP } from 'coinbase-api';

function requiredEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

const ws = new WebsocketClient({
  apiKey: requiredEnvVar('COINBASE_GLOBAL_API_KEY'),
  apiSecret: requiredEnvVar('COINBASE_GLOBAL_API_SECRET').replace(/\\n/g, '\n'),
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

ws.subscribe(
  ['user.orders.future.USDC.100ms', 'user.trades.future.USDC.100ms', 'user.portfolio.USDC'],
  WS_KEY_MAP.advTradeGlobalUserData,
);

function stop() {
  ws.closeAll();
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
