import { HttpsProxyAgent } from 'https-proxy-agent';
import { RestClientV5, WebsocketClient } from 'bybit-api';

const proxyUrl = process.env.PROXY_URL;
if (!proxyUrl) throw new Error('Set PROXY_URL to your HTTP or HTTPS proxy URL.');

const agent = new HttpsProxyAgent(proxyUrl);
const networkOptions = {
  proxy: false as const,
  httpsAgent: agent,
  timeout: 20_000,
};

export const client = new RestClientV5({ keepAlive: false }, networkOptions);

export const ws = new WebsocketClient({
  wsOptions: { agent },
});
