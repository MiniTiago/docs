---
title: "Coinbase SDK configuration"
description: "Configure REST timeouts, environments and WebSocket options."
---

# Configuration

## REST options

The first constructor argument configures SDK behavior and credentials. The second is Axios request configuration:

<<< @/../examples/configure-rest.ts

- `keepAlive` enables Node.js HTTPS connection reuse.
- `strictParamValidation` rejects undefined values during parameter serialization; it is not a complete validator for exchange order rules.
- `jwtExpiresSeconds` controls JWT expiry, defaulting to 120 seconds.
- `parseExceptions` defaults to `true`; see [Errors](/guides/errors).
- `baseUrl` overrides the REST origin. Only use a trusted destination because authenticated requests can carry credentials or tokens.

The SDK's default REST timeout is five minutes. Choose a shorter application-specific timeout where appropriate. A timeout does not establish that a state-changing request failed.

## Environments {#environments}

Set `useSandbox: true` on `CBAdvancedTradeClient` to use the static REST sandbox at `api-sandbox.coinbase.com`. It supplies mocked accounts/orders, not a matching engine or live account behavior. This flag changes the host, not the client's signing and request-building behavior. Do not use this static service to validate live authentication or execution.

There is **no Advanced Trade WebSocket sandbox**. Do not set `useSandbox` on the Advanced Trade stream clients. Leave it unset for the mainnet quickstart.

Other products have different environments. Follow their [product guides](/products).

## WebSocket options

`WebsocketClient` accepts credentials, `pingInterval`, `pongTimeout`, `reconnectTimeout`, `wsOptions`, `wsUrl` and `useSandbox`. Defaults manage connection health and recovery; keep the default logger enabled while integrating.

For the separate request-response options used by Global derivatives, see its [product guide](/products/global).

A `wsUrl` override applies to connections created by that client. Avoid reusing one override across unrelated feeds.

[Proxies](/guides/proxies) · [Production usage](/guides/production)
