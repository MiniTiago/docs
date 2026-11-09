---
title: "Kraken SDK API reference"
description: "Kraken REST and WebSocket methods, request parameters and response types for @siebly/kraken-api."
---

# API reference

Methods, parameters and response types exported by [`@siebly/kraken-api`](https://www.npmjs.com/package/@siebly/kraken-api). The same API is available in JavaScript and TypeScript.

## Clients

- [SpotClient](/api/classes/SpotClient)
- [DerivativesClient](/api/classes/DerivativesClient)
- [WebsocketClient](/api/classes/WebsocketClient)
- [WebsocketAPIClient](/api/classes/WebsocketAPIClient)

## Market data

| Task | Method |
| --- | --- |
| Read Spot tickers | [`SpotClient.getTicker()`](/api/classes/SpotClient#getticker) |
| Read a Spot order book | [`SpotClient.getOrderBook()`](/api/classes/SpotClient#getorderbook) |
| Read Spot pair metadata | [`SpotClient.getAssetPairs()`](/api/classes/SpotClient#getassetpairs) |
| Read Futures tickers | [`DerivativesClient.getTickers()`](/api/classes/DerivativesClient#gettickers) |
| Read a Futures order book | [`DerivativesClient.getOrderbook()`](/api/classes/DerivativesClient#getorderbook) |
| Subscribe to updates | [`WebsocketClient.subscribe()`](/api/classes/WebsocketClient#subscribe) |

## Account and orders

| Task | Method |
| --- | --- |
| Read Spot balances | [`getAccountBalance()`](/api/classes/SpotClient#getaccountbalance) |
| Validate or place a Spot order | [`submitOrder()`](/api/classes/SpotClient#submitorder) |
| Query Spot orders by ID | [`getOrders()`](/api/classes/SpotClient#getorders) |
| Read open Spot orders | [`getOpenOrders()`](/api/classes/SpotClient#getopenorders) |
| Read closed Spot orders | [`getClosedOrders()`](/api/classes/SpotClient#getclosedorders) |
| Cancel a Spot order | [`cancelOrder()`](/api/classes/SpotClient#cancelorder) |

Use [Authentication](/guides/authentication) for credentials, [Order validation](/guides/orders) for a non-trading request, and [Private account updates](/guides/private-streams) for streaming changes. Requests use Kraken's live services; see [environment availability](/guides/configuration#environments).

Search methods and types with **⌘K / Ctrl+K**.

[Reference index](/api/) · [Kraken API documentation](https://docs.kraken.com/api/)
