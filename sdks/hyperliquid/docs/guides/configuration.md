---
title: Configure the Hyperliquid SDK
description: Configure Hyperliquid Mainnet or Testnet, HTTP request timeouts and WebSocket connection options. Find default values and complete SDK option types.
---

# Configuration

Pass options when constructing a client. Network selection and signing options belong in the first argument; `RestClient` accepts HTTP request options in a second argument.

For retry decisions, rate limits and shutdown, see [Production usage](/guides/production). For a failed connection or request, see [Troubleshooting](/guides/troubleshooting).

## Networks

All three clients accept `testnet: true`. Configure each client explicitly so REST requests and subscriptions use the same network.

<<< @/../examples/testnet.ts

Mainnet is the default. When using a custom endpoint, `RestClientOptions.baseUrl` overrides the HTTP URL and `WebsocketClientOptions.wsUrl` overrides the WebSocket URL. Set `testnet` to match that endpoint so signed actions use the correct network.

## HTTP requests

The default HTTP request timeout is 10,000 ms. Change it through the second constructor argument:

<<< @/../examples/configure-rest.ts

The second argument accepts [`RestClientNetworkOptions`](/api/type-aliases/RestClientNetworkOptions), including custom headers and Axios network options. HTTP keep-alive is enabled by default and can be disabled with `keepAlive: false` in the first argument. HTTP requests are not retried automatically.

## WebSocket connections

`WebsocketClient` and `WebsocketAPIClient` accept connection and request timeouts in the first argument. This example allows 5 seconds to connect and 20 seconds for a request, including connection setup.

<<< @/../examples/configure-websocket.ts

| Option | Default | Description |
| --- | --- | --- |
| `autoReconnect` | `true` | Reconnect after an unexpected disconnect. |
| `connectionTimeout` | `1,000` ms | Maximum time to open a connection. |
| `requestTimeoutMs` | `10,000` ms | Maximum duration of a WebSocket request, including connection setup. |
| `reconnectTimeout` | `500` ms | Initial reconnect delay. |
| `maxReconnectTimeout` | `10,000` ms | Maximum reconnect delay. |

The delay increases with repeated connection failures. See [WebSocket subscriptions](/guides/websockets#reconnection) for subscription restoration and [`WebsocketClientOptions`](/api/interfaces/WebsocketClientOptions) for heartbeat and other options.

## Accounts and signing

Use `accountAddress` for account queries and `privateKey` or `signer` for signed actions. See [Authentication](/guides/authentication) for API wallets, vault addresses and address precedence.

## Browser usage

The SDK supports public REST requests and public subscriptions in browser bundles. Direct REST access also depends on the exchange's CORS policy. The examples in these guides target Node.js; replace Node-specific environment variables and shutdown handling when adapting them to a browser. For wallet access, use a [custom signer](/guides/authentication#custom-signers).

## Configuration reference

| Configuration | Reference |
| --- | --- |
| REST, accounts, signers and network | [RestClientOptions](/api/interfaces/RestClientOptions) |
| Socket timeouts, heartbeats and reconnects | [WebsocketClientOptions](/api/interfaces/WebsocketClientOptions) |
| Awaitable WebSocket request client | [WebsocketAPIClientOptions](/api/type-aliases/WebsocketAPIClientOptions) |
