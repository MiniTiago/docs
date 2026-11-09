---
title: Hyperliquid SDK API reference
description: Browse the public clients, request parameters, response types and WebSocket events exported by @siebly/hyperliquid-api.
---

# API reference

Client methods, parameters and response types exported by `@siebly/hyperliquid-api`. The same API works in JavaScript and TypeScript.

## Clients

| Client | Use it for |
| --- | --- |
| [RestClient](/api/classes/RestClient) | HTTP requests for market data, account state and Exchange actions |
| [WebsocketClient](/api/classes/WebsocketClient) | Streaming subscriptions, lifecycle events and raw WebSocket requests |
| [WebsocketAPIClient](/api/classes/WebsocketAPIClient) | Awaitable SDK methods over WebSocket |

## Common methods

Follow [Place and cancel an order](/guides/orders) for order submission and management, or [Account order updates](/guides/private-streams) for streaming status and fill events. Select the network in [Configuration](/guides/configuration).

| Task | Method |
| --- | --- |
| Get mid prices | [`getAllMids()`](/api/classes/RestClient#getallmids) |
| Get an order book | [`getOrderBook()`](/api/classes/RestClient#getorderbook) |
| Get candles | [`getCandles()`](/api/classes/RestClient#getcandles) |
| Read positions and margin | [`getPerpAccountSummary()`](/api/classes/RestClient#getperpaccountsummary) |
| Place orders | [`submitOrder()`](/api/classes/RestClient#submitorder) |
| Check an order by ID | [`getOrderStatus()`](/api/classes/RestClient#getorderstatus) |
| Subscribe to updates | [`subscribe()`](/api/classes/WebsocketClient#subscribe) |

Signed actions require [authentication](/guides/authentication). See [Error handling](/guides/errors) for rejected requests and per-order results.

For retries, recovery and shutdown, see [Production usage](/guides/production).

## Types

- [RestClientOptions](/api/interfaces/RestClientOptions)
- [GetOrderBookRequest](/api/interfaces/GetOrderBookRequest)
- [GetCandlesRequest](/api/interfaces/GetCandlesRequest)
- [WebsocketClientOptions](/api/interfaces/WebsocketClientOptions)
- [WebsocketClientEventMap](/api/interfaces/WebsocketClientEventMap)

## Find a method or type

Search guides, methods and types with **⌘K / Ctrl+K**.

[All exports](/api/)

[Hyperliquid tutorial](https://siebly.io/sdk/hyperliquid/javascript/tutorial) · [Upstream API documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api)
