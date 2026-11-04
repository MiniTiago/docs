---
title: Hyperliquid SDK API reference
description: Browse the public clients, request parameters, response types and WebSocket events exported by @siebly/hyperliquid-api.
---

# API reference

Browse the public TypeScript API for `@siebly/hyperliquid-api`. JavaScript users can use the same methods and parameter objects.

## Clients

| Client | Use it for |
| --- | --- |
| [RestClient](/api/classes/RestClient) | HTTP requests for market data, account state and Exchange actions |
| [WebsocketClient](/api/classes/WebsocketClient) | Streaming subscriptions, lifecycle events and raw WebSocket requests |
| [WebsocketAPIClient](/api/classes/WebsocketAPIClient) | Awaitable SDK methods over WebSocket |

## Common methods

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

Selected methods include the same examples used in the guides, with links to the complete workflow. For connection recovery, uncertain order outcomes and shutdown, see [Production usage](/guides/production).

## Types

- [RestClientOptions](/api/interfaces/RestClientOptions)
- [GetOrderBookRequest](/api/interfaces/GetOrderBookRequest)
- [GetCandlesRequest](/api/interfaces/GetCandlesRequest)
- [WebsocketClientOptions](/api/interfaces/WebsocketClientOptions)
- [WebsocketClientEventMap](/api/interfaces/WebsocketClientEventMap)

## Find a method or type

Use **Search** in the header, or press **⌘K** / **Ctrl+K**. Search includes guides, method names, descriptions and type fields.

[All exports](/api/)

For step-by-step workflows, visit the [Hyperliquid JavaScript tutorial](https://siebly.io/sdk/hyperliquid/javascript/tutorial). For HTTP protocol details, consult the [upstream Hyperliquid API documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api).
