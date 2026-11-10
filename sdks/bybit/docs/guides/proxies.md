---
title: "Bybit SDK proxies"
description: "Configure HTTP, HTTPS and SOCKS proxies for the Bybit SDK in Node.js."
---

# Use a proxy

<!--@include: @/.vitepress/shared/proxies/scope.md-->

Where an API key has an IP allowlist, allow the proxy's egress IP.

## HTTP or HTTPS proxy for REST

Axios accepts a `proxy` object in the REST client's second constructor argument:

<<< @/../examples/proxy-rest.ts

<!--@include: @/.vitepress/shared/proxies/rest-options.md-->
## Proxy agents for REST and WebSockets

<!--@include: @/.vitepress/shared/proxies/agent-setup.md-->
<<< @/../examples/proxy-agent.ts

`wsOptions.agent` configures the WebSocket connection. REST settings alone do not route WebSocket traffic through a proxy. Use `wsOptions.agent` for new code rather than the legacy `requestOptions.agent` fallback. Select the account's API region and live, Testnet or demo environment separately from its proxy.

`proxy: false` disables Axios's own proxy routing, including proxy environment variables, so the custom agent controls the REST route. Keep the SDK's `keepAlive` option false with a custom agent: enabling it replaces that agent with a standard HTTPS agent.

The `wsOptions` setting also applies to the WebSocket transport used by `WebsocketAPIClient`.

## SOCKS5

<!--@include: @/.vitepress/shared/proxies/socks.md-->
Use the same SOCKS agent in `wsOptions.agent`.

## Verify the route

Start with a public REST request such as `client.getTickers({ category: 'linear', symbol: 'BTCUSDT' })` and a [public subscription](/guides/websockets) using the configured clients. No API credentials are needed for these checks. Confirm both connections in your proxy logs; a successful REST request alone does not prove WebSocket routing.

<!--@include: @/.vitepress/shared/proxies/troubleshooting.md-->
