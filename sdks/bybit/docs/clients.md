---
title: "Bybit SDK clients"
description: "Choose a REST or WebSocket client for your Bybit integration."
---

# Clients

`RestClientV5` returns REST responses as promises. `WebsocketClient` delivers streaming updates through event listeners.

<!-- #region client-list -->
| Client | Purpose |
| --- | --- |
| `RestClientV5` | Current V5 market data, account queries and trading endpoints over HTTP. |
| `WebsocketClient` | Public and private subscriptions through `subscribeV5()`, with `update` events. |
| `WebsocketAPIClient` | Supported awaitable operations over the Bybit WebSocket API. |
<!-- #endregion client-list -->

## REST requests

<<< @/../examples/first-call.ts

`getTickers()` returns tickers in `result.list`. The example enables `throwExceptions: true` to handle API errors in `catch`.

## WebSocket subscriptions

Register listeners before subscribing with `WebsocketClient`. The [subscription example](/guides/websockets) shows message handling and shutdown.

## WebSocket API requests

`WebsocketAPIClient` returns promises for supported Bybit WebSocket API operations.

<!--@include: @/.vitepress/shared/clients/awaitable-websocket.md-->

Its [method list](/api/classes/WebsocketAPIClient) differs from the REST clients.

## Full reference

- [RestClientV5](/api/classes/RestClientV5)
- [WebsocketClient](/api/classes/WebsocketClient)
- [WebsocketAPIClient](/api/classes/WebsocketAPIClient)
