---
title: "Binance SDK clients"
description: "Choose a REST or WebSocket client for your Binance integration."
---

# Clients

Binance has separate REST clients for Spot, futures and Portfolio Margin. WebSocket clients handle streaming updates and request-response operations.

<!-- #region client-list -->
| Client | Purpose |
| --- | --- |
| `MainClient` | Spot and related account endpoints over HTTP. |
| `USDMClient` | USD-M futures endpoints. |
| `CoinMClient` | COIN-M futures endpoints. |
| `PortfolioClient` | Portfolio Margin endpoints. |
| `WebsocketClient` | Market and account streams, with raw `message` events and optional formatted events. |
| `WebsocketAPIClient` | Supported awaitable operations over Binance WebSocket APIs. |
<!-- #endregion client-list -->

## REST requests

<<< @/../examples/first-call.ts

`getSymbolPriceTicker()` returns response data directly. Its return type allows one ticker or an array; the example handles both before reading `price`.

## WebSocket subscriptions

Register listeners before subscribing with `WebsocketClient`. The [subscription example](/guides/websockets) shows message handling and shutdown.

## WebSocket API requests

`WebsocketAPIClient` returns promises for supported Binance WebSocket API operations. Its [method list](/api/classes/WebsocketAPIClient) differs from the REST clients.

## Full reference

- [MainClient](/api/classes/MainClient)
- [USDMClient](/api/classes/USDMClient)
- [CoinMClient](/api/classes/CoinMClient)
- [PortfolioClient](/api/classes/PortfolioClient)
- [WebsocketClient](/api/classes/WebsocketClient)
- [WebsocketAPIClient](/api/classes/WebsocketAPIClient)
