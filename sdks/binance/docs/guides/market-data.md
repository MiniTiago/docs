---
title: "Binance market data with JavaScript"
description: "Read Binance Spot prices and order-book snapshots with binance."
---

# Market data

Public prices and order books do not require API keys. These examples use BTCUSDT in the Spot market.

## Read a ticker

<<< @/../examples/first-call.ts

`MainClient.getSymbolPriceTicker()` returns the response data directly. Its TypeScript return type permits either one ticker or an array, so the example narrows the result before accessing `price`. These examples use Binance Spot.

## Read an order book

<<< @/../examples/order-book.ts

The first bid and ask entries contain a price and quantity. An empty side yields `undefined` in this example. Preserve decimal strings when exact quantities matter.

This REST response is a snapshot. For ongoing changes, use [WebSocket subscriptions](/guides/websockets) and implement the exchange's sequencing rules before maintaining a local order book.

## Choose the correct instrument

Check the product, environment and symbol together. Instruments and trading filters can change; query the exchange's instrument information rather than embedding a permanent list in your application.

[API reference](/reference) · [Exchange documentation](https://developers.binance.com/docs/binance-spot-api-docs)
