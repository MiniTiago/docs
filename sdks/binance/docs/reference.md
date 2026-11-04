---
title: "Binance SDK API reference"
description: "Public client methods, parameters and response types for binance."
---

# API reference

Browse the public exports of `binance`. JavaScript and TypeScript use the same client methods and parameter objects.

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

Use **Search** or press **⌘K / Ctrl+K** to find methods and types within this SDK. The SDK menu switches to another package's documentation.

[All exports](/api/) · [Binance tutorial](https://siebly.io/sdk/binance/javascript/tutorial) · [Upstream API documentation](https://developers.binance.com/docs/binance-spot-api-docs)
