---
title: Hyperliquid market data in JavaScript
description: Read Hyperliquid mid prices, L2 order books and candle history, and resolve Spot and perpetual asset names.
---

# Market data

Use `RestClient` for public HTTP requests. These examples do not need account credentials.

These REST examples read a snapshot or historical data. Use [WebSocket subscriptions](/guides/websockets) for ongoing price and order-book updates instead of polling REST.

## Mid prices

<<< @/../examples/first-call.ts

An empty book falls back to the last trade price. Spot mids are included when `dex` is omitted or empty. Use the optional `dex` parameter to query a specific perpetual DEX.

[Method reference: getAllMids](/api/classes/RestClient#getallmids)

## L2 order book

<<< @/../examples/order-book.ts

The response can be `null`, so check it before reading `levels`. The two arrays contain bids and asks, with up to 20 levels per side. Optional `nSigFigs` and `mantissa` parameters control aggregation.

The example prints the best bid and ask, or `null` for an empty side. A level contains `px` (price), `sz` (size) and `n` (number of orders). Prices and sizes are decimal strings. Illustrative output:

```json
{
  "bestBid": { "px": "65000", "sz": "0.42", "n": 3 },
  "bestAsk": { "px": "65001", "sz": "0.15", "n": 2 }
}
```

[getOrderBook reference](/api/classes/RestClient#getorderbook) · [Request parameters](/api/interfaces/GetOrderBookRequest) · [Response fields](/api/interfaces/OrderBookResponse)

## Candle history

<<< @/../examples/candles.ts

This example requests hourly BTC candles starting 24 hours ago. Times are Unix milliseconds. Only the most recent 5,000 candles are available.

[getCandles reference](/api/classes/RestClient#getcandles) · [Request parameters](/api/interfaces/GetCandlesRequest) · [Candle response](/api/interfaces/Candle)

## Asset names

Use `BTC` for a native perpetual, `@107` for a native Spot identifier, or a `dex:COIN` name for a HIP-3 market. `getOrderBook`, `getCandles` and `getFundingHistory` can resolve readable Spot aliases through metadata. Other Info methods and stream subscriptions pass `coin` through unchanged.

[Hyperliquid tutorial](https://siebly.io/sdk/hyperliquid/javascript/tutorial)
