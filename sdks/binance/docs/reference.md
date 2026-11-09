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

Use [Authentication](/guides/authentication) to verify account access, [Place and cancel an order](/guides/orders) for submission and order management, and [Private account updates](/guides/private-streams) for streaming changes.

Select the product and environment in [Configuration](/guides/configuration), with credentials and permissions for that account. Read the response types and [Error handling](/guides/errors) before sending orders.

| Task | Method |
| --- | --- |
| Read Spot account balances | [`getAccountInformation()`](/api/classes/MainClient#getaccountinformation) |
| Place a Spot order | [`submitNewOrder()`](/api/classes/MainClient#submitneworder) |
| Check a Spot order | [`getOrder()`](/api/classes/MainClient#getorder) |
| Cancel a Spot order | [`cancelOrder()`](/api/classes/MainClient#cancelorder) |

## USD-M futures

Use `USDMClient` for USD-M futures, separately from Spot and COIN-M. The [futures order walkthrough](/guides/usdm-orders) covers account reads, placement, status and cancellation using Demo Trading, with the corresponding production configuration.

| Task | Method |
| --- | --- |
| Read a futures ticker | [`getSymbolPriceTicker()`](/api/classes/USDMClient#getsymbolpriceticker) |
| Read a futures order book | [`getOrderBook()`](/api/classes/USDMClient#getorderbook) |
| Read futures account state | [`getAccountInformationV3()`](/api/classes/USDMClient#getaccountinformationv3) |
| Read futures balances | [`getBalanceV3()`](/api/classes/USDMClient#getbalancev3) |
| Read futures positions | [`getPositionsV3()`](/api/classes/USDMClient#getpositionsv3) |
| Check position mode | [`getCurrentPositionMode()`](/api/classes/USDMClient#getcurrentpositionmode) |
| Place a futures order | [`submitNewOrder()`](/api/classes/USDMClient#submitneworder) |
| Check a futures order | [`getOrder()`](/api/classes/USDMClient#getorder) |
| Cancel a futures order | [`cancelOrder()`](/api/classes/USDMClient#cancelorder) |

For COIN-M futures or Portfolio Margin, choose the corresponding client above; Spot and USD-M parameters are not interchangeable with those products.

Search methods and types with **⌘K / Ctrl+K**.

[All exports](/api/) · [Binance tutorial](https://siebly.io/sdk/binance/javascript/tutorial) · [Upstream API documentation](https://developers.binance.com/docs/binance-spot-api-docs)
