import { HttpsProxyAgent } from 'https-proxy-agent';
import { CBAdvancedTradeClient, WebsocketClient } from 'coinbase-api';

const proxyUrl = process.env.PROXY_URL;
if (!proxyUrl) {
  throw new Error('Set PROXY_URL to your HTTP or HTTPS proxy URL.');
}

const agent = new HttpsProxyAgent(proxyUrl);
export const client = new CBAdvancedTradeClient(
  { keepAlive: false },
  { proxy: false, httpsAgent: agent, timeout: 20000 },
);
export const ws = new WebsocketClient({ wsOptions: { agent } });
