---
title: "Binance WebSocket subscriptions"
description: "Subscribe to Binance ticker updates, handle connection events and close the client."
---

# WebSocket subscriptions

Subscribe to BTCUSDT Spot ticker updates. This public stream requires no API key.

## Subscribe to a ticker

Save the example as `stream.ts` in a TypeScript project. It prints incoming messages for thirty seconds, then closes its connections. It also handles Ctrl+C and process termination.

<<< @/../examples/stream.ts

## Subscription results and messages

Wait for subscription promises and catch failures. Incoming market updates arrive on `message`; subscription replies use `response`. A subscription acknowledgement is not a market-data snapshot.

## Recover after a disconnect

Listen for `reconnecting`, `reconnected` and `exception`. The client manages reconnection and remembered subscriptions. Application state can still be stale after a connection gap; reconcile orders and balances before acting on cached values.

For a local order book, follow Binance's documented snapshot and depth-update sequence rules. Reconnecting a socket alone does not rebuild an accurate book.

## Shut down

Call `closeAll()` to stop streaming connections. Clear your own timers and prevent new work during shutdown. The example closes all connections owned by this client instance.

[Production usage](/guides/production) · [WebsocketClient reference](/api/classes/WebsocketClient)
