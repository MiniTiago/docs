---
title: "Binance market data with JavaScript"
description: "Read Binance Spot prices and order-book snapshots with binance."
---

# Public market data (REST) {#market-data}

Public prices and order books do not require API keys. These examples use BTCUSDT in the Spot market.

These REST examples read a snapshot or historical data. Use [WebSocket subscriptions](/guides/websockets) for ongoing price and order-book updates instead of polling REST.

## Read a ticker

<<< @/../examples/first-call.ts

`getSymbolPriceTicker()` returns one ticker or an array, with prices as strings. This single-symbol example rejects an unexpected array.

## Read an order book

<<< @/../examples/order-book.ts

Each bid and ask contains a price and quantity as decimal strings. The example returns `undefined` for an empty side.

If JavaScript numbers suit your application, the SDK can convert known numeric strings with `beautifyResponses: true`; see [response formatting](/guides/configuration#preserve-decimal-precision). The raw values above remain useful for exact decimal arithmetic.

For a live order book, combine this snapshot with [WebSocket depth updates](/guides/websockets) using Binance's update-ID rules.

## Choose the correct instrument

Query exchange information for the selected product and environment to get current symbols and trading filters.

[API reference](/reference) · [Exchange documentation](https://developers.binance.com/docs/binance-spot-api-docs)
