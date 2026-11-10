import { WebsocketClient, WS_KEY_MAP } from 'coinbase-api';

function requiredEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

const ws = new WebsocketClient({
  apiKey: requiredEnvVar('COINBASE_INTX_API_KEY'),
  apiSecret: requiredEnvVar('COINBASE_INTX_API_SECRET'),
  apiPassphrase: requiredEnvVar('COINBASE_INTX_API_PASSPHRASE'),
});

ws.on('update', (event) => {
  console.log(event);
});
ws.on('response', (event) => {
  console.log(event);
});
ws.on('exception', (error) => {
  console.error(error);
});
ws.on('reconnect', (event) => {
  console.log(event);
});
ws.on('reconnected', (event) => {
  console.log(event);
});

ws.subscribe(
  { topic: 'LEVEL1', payload: { product_ids: ['BTC-PERP'] } },
  WS_KEY_MAP.internationalMarketData,
);

function stop() {
  ws.closeAll();
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
