---
title: "Bybit market data with JavaScript"
description: "Read Bybit Spot prices and order-book snapshots with bybit-api."
---

# Market data

Public prices and order books do not require API keys. These examples use BTCUSDT in the Spot market.

## Read a ticker

<<< @/../examples/first-call.ts

`getTickers()` returns a response envelope. Check `retCode === 0` before reading `result.list`. The `category` selects the market; these examples use `spot`. A symbol such as `BTCUSDT` may also exist in a derivatives category.

## Read an order book

<<< @/../examples/order-book.ts

The first bid and ask entries contain a price and quantity. An empty side yields `undefined` in this example. Preserve decimal strings when exact quantities matter.

This REST response is a snapshot. For ongoing changes, use [WebSocket subscriptions](/guides/websockets) and implement the exchange's sequencing rules before maintaining a local order book.

## Choose the correct instrument

Check the product, environment and symbol together. Instruments and trading filters can change; query the exchange's instrument information rather than embedding a permanent list in your application.

[API reference](/reference) · [Exchange documentation](https://bybit-exchange.github.io/docs/v5/intro)
