import { WebsocketClient, WS_KEY_MAP } from '@siebly/kraken-api';

function requiredEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}.`);
  }
  return value;
}

const ws = new WebsocketClient({
  apiKey: requiredEnvVar('KRAKEN_API_KEY'),
  apiSecret: requiredEnvVar('KRAKEN_API_SECRET'),
});

ws.on('message', (message) => console.log(message));
ws.on('response', (response) =>
  console.log('Subscription response:', response),
);
ws.on('exception', (error) => console.error('WebSocket exception:', error));
ws.on('reconnecting', (event) => console.log('Reconnecting:', event));
ws.on('reconnected', (event) => console.log('Reconnected:', event));

// Authentication and the Spot WebSocket token are managed by the SDK.
ws.subscribe('executions', WS_KEY_MAP.spotPrivateV2);

const timer = setTimeout(stop, 30000);
function stop() {
  clearTimeout(timer);
  ws.closeAll();
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
