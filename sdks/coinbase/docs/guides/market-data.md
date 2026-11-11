---
title: "Coinbase market data"
description: "Read public Advanced Trade products, books, candles and trades."
---

# Market data

Advanced Trade has separate public and authenticated market-data methods. For requests without credentials, choose methods with `Public` in the name. `getProduct()`, `getProductBook()`, `getProducts()` and `getBestBidAsk()` use private routes even though they return market data.

## Product and price

<<< @/../examples/first-call.ts

Use `getPublicProducts()` to discover products. Product metadata includes price and size increments, minimum sizes and trading restrictions. Keep decimal quantities as strings and validate against the current product rules before building an order.

## Order book

<<< @/../examples/order-book.ts

The response contains `pricebook`, with bids, asks, product ID and time. This is a snapshot, not a maintained local book. Use the `level2` [WebSocket channel](/guides/websockets) for ongoing updates, following its snapshot and sequence rules.

## Candles and trades

- `getPublicProductCandles()` takes `product_id`, Unix-second `start` and `end` strings, and a supported `granularity` such as `ONE_MINUTE`.
- `getPublicMarketTrades()` takes `product_id` and `limit`, with optional time bounds.
- `getServerTime()` returns the server's ISO and epoch timestamps.

Public endpoints can return cached data. Do not treat a successful response as proof that the price is fresh enough for trading. Check timestamps and use streams for time-sensitive changes.

[Advanced Trade client reference](/api/classes/CBAdvancedTradeClient) · [Other API families](/products)
