---
title: "Binance SDK clients"
description: "Choose a REST or WebSocket client for your Binance integration."
---

# Clients

Choose the client for your transport and market. A REST call returns a promise; streaming data arrives through WebSocket event listeners.

| Client | Purpose |
| --- | --- |
| `MainClient` | Spot and related account endpoints over HTTP. |
| `USDMClient` | USD-M futures endpoints. |
| `CoinMClient` | COIN-M futures endpoints. |
| `PortfolioClient` | Portfolio Margin endpoints. |
| `WebsocketClient` | Market and account streams, with raw `message` events and optional formatted events. |
| `WebsocketAPIClient` | Supported awaitable operations over Binance WebSocket APIs. |

## REST requests

<<< @/../examples/first-call.ts

`MainClient.getSymbolPriceTicker()` returns the response data directly. Its TypeScript return type permits either one ticker or an array, so the example narrows the result before accessing `price`. These examples use Binance Spot.

## WebSocket subscriptions

Use `WebsocketClient` for ongoing updates. Register event listeners before subscribing and close the connections when the application shuts down. See [WebSocket subscriptions](/guides/websockets) for a runnable example.

## WebSocket API requests

`WebsocketAPIClient` provides awaitable operations for the exchange's supported WebSocket API methods. Consult its [generated reference](/api/classes/WebsocketAPIClient) for available methods; do not assume that it exposes every REST operation.

## Full reference

- [MainClient](/api/classes/MainClient)
- [USDMClient](/api/classes/USDMClient)
- [CoinMClient](/api/classes/CoinMClient)
- [PortfolioClient](/api/classes/PortfolioClient)
- [WebsocketClient](/api/classes/WebsocketClient)
- [WebsocketAPIClient](/api/classes/WebsocketAPIClient)
