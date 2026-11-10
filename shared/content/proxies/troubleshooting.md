- A `407` response usually means proxy authentication is missing or rejected.
- Connection timeouts can indicate the proxy cannot reach the exchange or does not allow CONNECT/WebSocket traffic.
- Keep TLS certificate verification enabled. For an approved corporate proxy, use its trusted CA rather than disabling verification.
- Extra latency can affect signed-request timing. Keep the machine clock synchronized and distinguish the HTTP timeout from the exchange's acceptance window.
- Do not log whole request configurations, proxy URLs with credentials or signed request data.

See [configuration](/guides/configuration), [production usage](/guides/production) and the [Siebly proxy guide](https://siebly.io/blog/using-proxy-with-siebly-sdks).
