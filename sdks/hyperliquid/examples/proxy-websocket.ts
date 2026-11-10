import { HttpsProxyAgent } from 'https-proxy-agent';
import WebSocket from 'ws';
import { WebsocketClient, type WebSocketConstructor } from '@siebly/hyperliquid-api';

const proxyUrl = process.env.PROXY_URL;
if (!proxyUrl) throw new Error('Set PROXY_URL to your HTTP or HTTPS proxy URL.');
const proxy = new URL(proxyUrl);
if (proxy.protocol !== 'http:' && proxy.protocol !== 'https:') {
  throw new Error('This example requires an HTTP or HTTPS proxy.');
}
const agent = new HttpsProxyAgent(proxyUrl);

class ProxiedWebSocket extends WebSocket {
  constructor(url: string) {
    super(url, { agent });
  }
}

export const ws = new WebsocketClient({
  webSocketConstructor: ProxiedWebSocket as unknown as WebSocketConstructor,
  requestOptions: {
    proxy: {
      protocol: proxy.protocol.slice(0, -1),
      host: proxy.hostname,
      port: Number(proxy.port || (proxy.protocol === 'https:' ? 443 : 80)),
      ...(proxy.username || proxy.password
        ? { auth: {
            username: decodeURIComponent(proxy.username),
            password: decodeURIComponent(proxy.password),
          } }
        : {}),
    },
    timeout: 20_000,
  },
});
