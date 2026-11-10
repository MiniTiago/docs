Set `protocol`, `host` and `port` to your proxy, not the exchange. Use `protocol: 'https'` for a TLS connection to the proxy. For proxy authentication, add `auth: { username, password }` using values loaded from your environment or secret store.

In Node.js, Axios can also read `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` when no explicit `proxy` is configured. Do not rely on those variables for WebSockets; configure their agent or constructor explicitly.
