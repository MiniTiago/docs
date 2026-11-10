---
title: "Kraken SDK clients"
description: "Choose Kraken Spot, Futures and streaming clients for your application."
---

# Clients

REST clients return promises. `WebsocketClient` delivers subscriptions through event listeners, while `WebsocketAPIClient` exposes awaitable Spot WebSocket operations.

<!-- #region client-list -->
| Client | Purpose |
| --- | --- |
| `SpotClient` | Spot market data, balances, orders and account operations over REST. |
| `DerivativesClient` | Futures market data, account queries and trading over REST. |
| `WebsocketClient` | Public and private Spot and Futures subscriptions. |
| `WebsocketAPIClient` | Awaitable Spot WebSocket API requests. |
<!-- #endregion client-list -->

Start with `SpotClient` for Spot endpoints or `DerivativesClient` for Futures. These APIs use different credentials, symbols and response formats.

## REST requests

<<< @/../examples/first-call.ts

## WebSocket subscriptions

Register event listeners before calling `subscribe()`. Choose the connection with `WS_KEY_MAP`, such as `spotPublicV2` for public Spot v2 data. See the [complete subscription example](/guides/websockets).

## WebSocket requests

Use [`WebsocketAPIClient`](/api/classes/WebsocketAPIClient) when a supported Spot operation should return a promise instead of being handled as a stream.

<!--@include: @/.vitepress/shared/clients/awaitable-websocket.md-->

A lost connection can reject an in-flight request even if the exchange processed it; [reconcile uncertain outcomes](/guides/production#resolve-uncertain-order-outcomes) before retrying an order.

[Reference index](/api/) · [API reference](/reference)
