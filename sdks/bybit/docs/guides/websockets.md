---
title: "Bybit WebSocket subscriptions"
description: "Subscribe to Bybit ticker updates, handle connection events and close the client."
---

# WebSocket subscriptions

Subscribe to BTCUSDT Spot ticker updates. This public stream requires no API key.

## Subscribe to a ticker

Save the example as `stream.ts` in a TypeScript project. It prints incoming messages for thirty seconds, then closes its connections. It also handles Ctrl+C and process termination.

<<< @/../examples/stream.ts

## Subscription results and messages

Wait for subscription promises and catch failures. Incoming market updates arrive on `update`; subscription replies use `response`. A subscription acknowledgement is not a market-data snapshot.

## Recover after a disconnect

Listen for `reconnect`, `reconnected` and `exception`. The client manages reconnection and remembered subscriptions, but your application must decide when its local state is current again. After a gap, reconcile orders and positions with REST before acting on cached state.

Bybit V5 channels have different snapshot and delta semantics. Follow the documentation for each topic instead of treating every update as a complete replacement.

## Shut down

Call `closeAll()` to stop streaming connections. Clear your own timers and prevent new work during shutdown. The example closes all connections owned by this client instance.

[Production usage](/guides/production) · [WebsocketClient reference](/api/classes/WebsocketClient)
