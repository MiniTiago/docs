export const endpoints = {"rest": "https://api.hyperliquid.xyz/info", "websocket": "wss://api.hyperliquid.xyz/ws"};
export function client(sdk) { return new sdk.RestClient({}, {timeout:15000}); }
export async function read(client) { return (await client.getAllMids()).BTC; }
export function stream(sdk, logger) { return new sdk.WebsocketClient({}, logger); }
export const event = 'message';
export function value(message) { return message.channel === 'allMids' ? message.data?.mids?.BTC : undefined; }
export async function subscribe(ws) { await ws.subscribe({ type: 'allMids' }); }
export const typeExample = `import { RestClient, WebsocketClient } from '@siebly/hyperliquid-api';
const rest = new RestClient();
const response: Promise<Record<string, string>> = rest.getAllMids();
const ws = new WebsocketClient();
ws.closeAll();
void response;
`;
