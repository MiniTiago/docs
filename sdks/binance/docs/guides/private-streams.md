---
title: "Binance private user data streams"
description: "Authenticate a Spot Testnet user data subscription and receive order updates with the WebSocket API."
---

# Subscribe to private order updates

Use `WebsocketAPIClient` to receive Spot account and order events through Binance's WebSocket API. This is separate from public market-data subscriptions. Spot's older listen-key workflow is deprecated; use `subscribeUserDataStream()` for new integrations.

## Connect to Spot Testnet

Use Node.js 24, install `binance`, and configure the Testnet credential variables from [your first order](/guides/orders#set-up). `BINANCE_TESTNET=true` is required. Keep signing credentials on the server and out of browser bundles.

Save this as `private-stream.ts`:

<<< @/../examples/private-stream.ts

Run it before placing an order in another terminal:

```sh
node --env-file=.env private-stream.ts
```

The SDK maps `WS_KEY_MAP.mainWSAPI` to the Spot Testnet WebSocket API when `testnet: true`. The helper uses `userDataStream.subscribe` on an authenticated Ed25519 session, or a signed `userDataStream.subscribe.signature` request for HMAC/RSA credentials. This example accepts an HMAC API secret through the environment; see [authentication](/guides/authentication) for credential handling.

Listeners are registered before subscribing so early messages are not missed. Once subscribed, the script waits for account activity. A quiet account may produce no events during the 60-second window.

## Read order events

The SDK unwraps the WebSocket API envelope before emitting `message`: inspect `message.e`, not `message.event.e`. With `beautify: false`, an `executionReport` includes:

- `s`: symbol.
- `c`: client order ID, which you can correlate with the order receipt.
- `x`: execution type, such as `NEW`, `TRADE` or `CANCELED`.
- `X`: current order status, such as `NEW`, `PARTIALLY_FILLED` or `FILLED`.
- `l`: quantity executed in the latest fill.
- `z`: cumulative executed quantity.

The example prints only selected order fields and a notification when balances change. It does not dump credentials, full account messages or transport errors. Consult the [user data stream payloads](https://developers.binance.com/docs/binance-spot-api-docs/user-data-stream) for the complete event definitions.

## Disconnect and recover

The example closes its connections after 60 seconds, on Ctrl+C/SIGTERM, on a subscription exception or when reconnection begins. Automatic resubscription is disabled so this short-lived process cannot silently resume with missing account updates. Closing the stream does not cancel orders.

For a long-running application, the SDK enables automatic resubscription by default. Track `reconnecting` and `reconnected`, pause decisions based on stale state, and reconcile open orders, fills and balances using REST after a gap. A restored subscription is not a replay of missed events. Use a single owner for subscription recovery rather than competing retry loops.

To stop just a user data subscription while keeping a connection, await `unsubscribeUserDataStream(WS_KEY_MAP.mainWSAPI)`. To end all connections owned by this API client, call `disconnectAll()`. A dedicated finite client, as above, can simply close its connections. Remove application timers and signal listeners during shutdown.

[First order](/guides/orders) · [WebSocket API client reference](/api/classes/WebsocketAPIClient) · [Binance subscription methods](https://developers.binance.com/docs/binance-spot-api-docs/websocket-api/user-data-stream-requests)
