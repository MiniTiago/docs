---
title: "Bybit WebSocket subscriptions"
description: "Subscribe to Bybit ticker updates, handle connection events and close the client."
---

# WebSocket subscriptions

Subscribe to BTCUSDT Spot ticker updates. This public stream requires no API key.

## Subscribe to a ticker

Save this as `stream.ts` in a TypeScript project. It prints updates for 30 seconds and closes on completion, Ctrl+C or `SIGTERM`.

<<< @/../examples/stream.ts

## Subscription results and messages

`subscribeV5()` returns an array of promises, so use `Promise.all()` to await them. With the default settings, completion does not mean Bybit accepted the subscription. Successful subscription replies arrive on `response`; rejected requests arrive on `exception`. Market data arrives on `update`.

## Recover after a disconnect

The client reconnects and restores subscriptions. Use `reconnect`, `reconnected` and `exception` to track connection changes. See [stream recovery](/guides/production#recover-streaming-state) for rebuilding application state after a gap.

## Shut down

Call `closeAll()` to close this client's connections. Clear application timers and stop new work during shutdown.

[Production usage](/guides/production) · [WebsocketClient reference](/api/classes/WebsocketClient)
