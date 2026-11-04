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

For example, a message payload might contain the following fields. Values are illustrative; the full event also includes connection context.

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

After an account-stream gap, reload the relevant state before relying on incremental updates again. A restored connection does not tell your application what happened while it was disconnected. See [Production usage](/guides/production#recover-after-a-disconnect) for recovery and [Troubleshooting](/guides/troubleshooting#websocket-subscriptions) if updates do not arrive.

## Unsubscribe and close

Call [`unsubscribe()`](/api/classes/WebsocketClient#unsubscribe) with the original subscription object to remove a topic. The cached topic is removed even while disconnected, so it will not be restored on reconnect. Event listeners and subscriptions have separate lifecycles: removing a listener does not unsubscribe a topic.

Call `closeAll()` when the application no longer needs the client. This closes connections and cancels queued reconnects. The example above also clears its timer and removes its process listener.

## Asset names

Stream subscriptions use native coin names. Resolve a readable alias with `nameToCoin()` before subscribing when needed.

See the [Siebly Hyperliquid tutorial](https://siebly.io/sdk/hyperliquid/javascript/tutorial) for account streams, recovery and proxy examples.
