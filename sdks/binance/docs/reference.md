---
title: "Binance SDK API reference"
description: "Public client methods, parameters and response types for binance."
---

# API reference

Client methods, parameters and response types exported by `binance`. The same API works in JavaScript and TypeScript.

## Clients

- [MainClient](/api/classes/MainClient)
- [USDMClient](/api/classes/USDMClient)
- [CoinMClient](/api/classes/CoinMClient)
- [PortfolioClient](/api/classes/PortfolioClient)
- [WebsocketClient](/api/classes/WebsocketClient)
- [WebsocketAPIClient](/api/classes/WebsocketAPIClient)

## Common methods

| Task | Method |
| --- | --- |
| Read a Spot ticker | [`getSymbolPriceTicker()`](/api/classes/MainClient#getsymbolpriceticker) |
| Read a Spot order book | [`getOrderBook()`](/api/classes/MainClient#getorderbook) |
| Subscribe to ticker updates | [`subscribeSpotSymbol24hrTicker()`](/api/classes/WebsocketClient#subscribespotsymbol24hrticker) |
| Close streaming connections | [`closeAll()`](/api/classes/WebsocketClient#closeall) |

## Account and orders

Follow [Place and cancel an order](/guides/orders) for a complete Testnet workflow. Use [Private order updates](/guides/private-streams) to receive changes over WebSocket.

Start by [verifying account access](/guides/authentication#verify-account-access) on Testnet. These methods require credentials with the relevant permissions; read the response type and [error handling](/guides/errors) before sending orders.

| Task | Method |
| --- | --- |
| Read Spot account balances | [`getAccountInformation()`](/api/classes/MainClient#getaccountinformation) |
| Place a Spot order | [`submitNewOrder()`](/api/classes/MainClient#submitneworder) |
| Check a Spot order | [`getOrder()`](/api/classes/MainClient#getorder) |
| Cancel a Spot order | [`cancelOrder()`](/api/classes/MainClient#cancelorder) |

For futures or Portfolio Margin, choose the corresponding client above; Spot methods are not interchangeable with those products.

Search methods and types with **⌘K / Ctrl+K**.

[All exports](/api/) · [Binance tutorial](https://siebly.io/sdk/binance/javascript/tutorial) · [Upstream API documentation](https://developers.binance.com/docs/binance-spot-api-docs)
