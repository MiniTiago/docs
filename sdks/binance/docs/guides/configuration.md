---
title: "Binance SDK configuration"
description: "Select Binance environments and configure request timeouts and client options."
---

# Configuration

For HTTP, HTTPS or SOCKS routing in Node.js, see [Use a proxy](/guides/proxies).

## Configure a REST client

<<< @/../examples/configure-rest.ts

The first constructor argument contains SDK settings such as `testnet`, `api_key`, `api_secret` and `recvWindow`. The second contains Axios request options, including `timeout` in milliseconds.

The example selects Spot Testnet and a ten-second HTTP timeout. `recvWindow` is the signed request acceptance window; it is separate from the HTTP timeout.

## Select a market and environment

`MainClient` uses Spot endpoints. `USDMClient` and `CoinMClient` target their respective futures products. Select the client first, then choose an environment supported by that product. `testnet: true` selects the supported test endpoint for the client; demo trading uses the separate `demoTrading` setting.

Production is the default when `testnet` and `demoTrading` are false or omitted. Use credentials created for the selected production account, not Testnet keys. Keys and symbols also depend on the product. See the [Binance documentation](https://developers.binance.com/docs/binance-spot-api-docs).

## Response formatting {#preserve-decimal-precision}

The SDK beautifier makes responses easier to work with. For WebSockets, set `beautify: true` and listen to `formattedMessage` for descriptive field names and parsed numeric values; see the [streaming example](/guides/websockets#optional-readable-fields-with-the-sdk-beautifier).

For REST, `beautifyResponses: true` in the first constructor argument converts known numeric strings to JavaScript numbers. It is disabled by default. Keep it disabled, or use raw WebSocket `message` events, when you need the original strings for exact decimal arithmetic.

## Reuse clients

Reuse a client for each credential and environment combination. Limit concurrent requests in the application.

[Client reference](/api/classes/MainClient) · [Production usage](/guides/production)
