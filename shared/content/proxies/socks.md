Install `socks-proxy-agent`, replace the `HttpsProxyAgent` import with `SocksProxyAgent`, and construct the agent from your SOCKS proxy URL:

```sh
npm install socks-proxy-agent
```

```ts
import { SocksProxyAgent } from 'socks-proxy-agent';

const agent = new SocksProxyAgent('socks5h://127.0.0.1:1080');
```

`socks5h://` resolves destination hostnames through the proxy. Keep `proxy: false` for REST and pass the agent as `httpsAgent`; Axios's `proxy` object does not support SOCKS.
