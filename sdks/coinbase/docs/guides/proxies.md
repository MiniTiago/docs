---
title: "Coinbase SDK proxies"
description: "Route Coinbase REST and WebSocket connections through HTTP, HTTPS or SOCKS proxies."
---

# Use a proxy

<!--@include: @/.vitepress/shared/proxies/scope.md-->

If a Coinbase API key uses an IP allowlist, allow the proxy's egress IP.

## HTTP or HTTPS proxy for REST

Pass Axios configuration in the REST client's second constructor argument:

<<< @/../examples/proxy-rest.ts

<!--@include: @/.vitepress/shared/proxies/rest-options.md-->

## Proxy agents for REST and WebSockets

<!--@include: @/.vitepress/shared/proxies/agent-setup.md-->

<<< @/../examples/proxy-agent.ts

`proxy: false` disables Axios proxy routing, including proxy environment variables, so the agent controls the REST route. Keep the SDK's `keepAlive` option false: enabling it replaces your custom agent with a standard HTTPS agent. Configure connection reuse on the custom agent itself if needed.

`wsOptions.agent` configures the Node.js WebSocket transport independently. The same setting is accepted by `WebsocketAPIClient`. Coinbase WebSocket authentication is performed through signing or the socket session; these clients do not have the separate REST token request options used by some other exchange SDKs.

## SOCKS5

<!--@include: @/.vitepress/shared/proxies/socks.md-->

Pass the SOCKS agent as both REST `httpsAgent` and `wsOptions.agent`, with REST `proxy: false` and SDK `keepAlive: false`.

## Verify the route

Use a public `getPublicProduct()` request and an Advanced Trade ticker subscription with the configured clients. Confirm **both** connections in the proxy logs. Successful REST routing alone does not prove WebSocket routing.

<!--@include: @/.vitepress/shared/proxies/troubleshooting.md-->
