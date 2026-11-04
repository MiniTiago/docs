---
title: Hyperliquid WebSocket subscriptions in Node.js
description: Stream Hyperliquid prices with WebsocketClient, handle events and close connections cleanly. Compare streaming subscriptions with awaitable WebSocket API requests.
---

# WebSocket subscriptions

The SDK provides two WebSocket clients. Use `WebsocketClient` to subscribe to updates, or `WebsocketAPIClient` to await individual request responses.

## Subscribe to mid prices

Register listeners before subscribing. Save this example as `stream.mjs` and run `node stream.mjs`. It runs for 30 seconds, then closes the connection. Ctrl+C or `SIGTERM` runs the same cleanup.

<<< @/../examples/stream.ts

The `message` event carries subscription data. For the `allMids` channel, `event.data.mids` maps coin names to price strings. Inspect `channel` to narrow the event's `data` type.

Example payload fields; the full event also includes connection context:

```json
{
  "channel": "allMids",
  "data": { "mids": { "BTC": "65000.5", "ETH": "2500.2" } }
}
```

`subscribe()` resolves after sending locally. Subscription acknowledgements and WebSocket POST responses arrive through `response`; protocol and connection failures arrive through `exception`.

[Subscription types](/api/type-aliases/WebsocketSubscription) · [Event map](/api/interfaces/WebsocketClientEventMap)

## Make a request over WebSocket

`WebsocketAPIClient` inherits the REST client's methods and sends requests through Hyperliquid's WebSocket POST protocol. Close the client when the work is finished.

<<< @/../examples/ws-request.ts

[WebsocketAPIClient reference](/api/classes/WebsocketAPIClient)

## Reconnection

The client reconnects after unexpected disconnects by default and restores cached subscriptions. It exposes `reconnecting`, `reconnected` and `exception` events. Set `autoReconnect: false` to disable automatic reconnection.

After an account-stream gap, [reload affected state](/guides/production#recover-after-a-disconnect) before applying incremental updates. If updates do not arrive, see [Troubleshooting](/guides/troubleshooting#websocket-subscriptions).

## Unsubscribe and close

Call [`unsubscribe()`](/api/classes/WebsocketClient#unsubscribe) with the original subscription object to remove a topic, including its cached subscription while disconnected. Removing an event listener leaves the subscription active.

Call `closeAll()` to close connections and cancel queued reconnects. Clear timers and process listeners as shown in the example.

## Asset names

Stream subscriptions use native coin names. Resolve a readable alias with `nameToCoin()` before subscribing when needed.

See the [Siebly Hyperliquid tutorial](https://siebly.io/sdk/hyperliquid/javascript/tutorial) for account streams, recovery and proxy examples.
