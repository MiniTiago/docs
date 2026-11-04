---
title: "Bybit SDK clients"
description: "Choose a REST or WebSocket client for your Bybit integration."
---

# Clients

Choose the client for your transport and market. A REST call returns a promise; streaming data arrives through WebSocket event listeners.

| Client | Purpose |
| --- | --- |
| `RestClientV5` | Current V5 market data, account queries and trading endpoints over HTTP. |
| `WebsocketClient` | Public and private subscriptions through `subscribeV5()`, with `update` events. |
| `WebsocketAPIClient` | Supported awaitable operations over the Bybit WebSocket API. |

## REST requests

<<< @/../examples/first-call.ts

`getTickers()` returns a response envelope. Check `retCode === 0` before reading `result.list`. The `category` selects the market; these examples use `spot`. A symbol such as `BTCUSDT` may also exist in a derivatives category.

## WebSocket subscriptions

Use `WebsocketClient` for ongoing updates. Register event listeners before subscribing and close the connections when the application shuts down. See [WebSocket subscriptions](/guides/websockets) for a runnable example.

## WebSocket API requests

`WebsocketAPIClient` provides awaitable operations for the exchange's supported WebSocket API methods. Consult its [generated reference](/api/classes/WebsocketAPIClient) for available methods; do not assume that it exposes every REST operation.

## Full reference

- [RestClientV5](/api/classes/RestClientV5)
- [WebsocketClient](/api/classes/WebsocketClient)
- [WebsocketAPIClient](/api/classes/WebsocketAPIClient)
