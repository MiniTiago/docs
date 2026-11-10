---
title: "Kraken market data"
description: "Read public Kraken Spot order books and Futures tickers without credentials."
---

# Public market data (REST) {#market-data}

Public Spot and Futures endpoints need no API credentials.

## Spot order book

Save this plain JavaScript example as `order-book.mjs` and run `node order-book.mjs`:

<<< @/../examples/order-book.ts{js}

The response contains `result`, keyed by Kraken's returned pair name. Each `bids` or `asks` entry contains price, volume and timestamp. `count: 10` requests ten levels per side; the available book may contain fewer.

Spot REST accepts aliases such as `XBTUSD`. Spot WebSocket v2 uses symbols such as `BTC/USD`. Read [`getAssetPairs()`](/api/classes/SpotClient#getassetpairs) and the WebSocket `instrument` channel for the corresponding product metadata rather than substituting symbol formats across APIs.

## Futures tickers

Save this as `futures.mjs` and run `node futures.mjs`:

<<< @/../examples/futures-market-data.ts{js}

Futures responses have a different structure: `getTickers()` returns `tickers` directly on the response, not under Spot's `result` object. Use the returned contract symbols with the corresponding Futures methods.

## Streaming data

Use [WebSocket subscriptions](/guides/websockets) for updates instead of repeatedly polling a ticker. A local order book requires the channel's snapshot, update and checksum rules; a stream of book messages is not itself a complete maintained book.

[SpotClient reference](/api/classes/SpotClient) · [DerivativesClient reference](/api/classes/DerivativesClient)
