---
title: "Bybit market data with JavaScript"
description: "Read Bybit Spot prices and order-book snapshots with bybit-api."
---

# Market data

Public prices and order books do not require API keys. These examples use BTCUSDT in the Spot market.

## Read a ticker

<<< @/../examples/first-call.ts

These examples enable `throwExceptions: true`, so API errors reject the request. Set `category` to select the market; `BTCUSDT` can exist in both Spot and derivatives.

## Read an order book

<<< @/../examples/order-book.ts

Each bid and ask contains a price and quantity as decimal strings. The example returns `undefined` for an empty side.

For a live order book, use [WebSocket updates](/guides/websockets) and apply Bybit's snapshot and delta rules.

## Choose the correct instrument

Query instrument information for the selected `category` and environment to get current symbols and trading filters.

[API reference](/reference) · [Exchange documentation](https://bybit-exchange.github.io/docs/v5/intro)
