---
title: "Binance private user data streams"
description: "Receive Spot account and order updates with the WebSocket API, demonstrated on Testnet."
---

# Subscribe to private account updates

Use `WebsocketAPIClient` to receive Spot account and order events through Binance's WebSocket API. It supports Mainnet and Spot Testnet; this walkthrough uses Testnet. Private account events are separate from public market-data subscriptions. Spot's older listen-key workflow is deprecated; use `subscribeUserDataStream()` for new integrations.

## Example: connect to Spot Testnet

To run this example on Spot Testnet, use Node.js 24, install `binance`, and configure the credential variables from [your first order](/guides/orders#set-up). Keep signing credentials in a secure server-side environment and out of browser bundles.

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
- `i`: exchange order ID, which stays stable through cancellation.
- `x`: execution type, such as `NEW`, `TRADE` or `CANCELED`.
- `X`: current order status, such as `NEW`, `PARTIALLY_FILLED` or `FILLED`.
- `l`: quantity executed in the latest fill.
- `z`: cumulative executed quantity.

Match `i` to the `BINANCE_ORDER_ID` returned by the order example. The stream prints selected order fields, balance events and other received messages. Stream and subscription errors are logged with their error objects. Consult the [user data stream payloads](https://developers.binance.com/docs/binance-spot-api-docs/user-data-stream) for the complete event definitions.

## Disconnect and recover

The SDK reconnects automatically after a dropped connection and restores the user data subscription. The example logs `reconnecting` and `reconnected` without closing the client or setting a failure exit code. It keeps the SDK's default `resubscribeUserDataStreamAfterReconnect` behavior enabled; no manual resubscription loop is needed.

`reconnected` confirms the socket is open again. Authentication and resubscription may still be completing. For applications that depend on complete account state, reconcile orders, fills and balances through REST after a gap; a restored subscription does not replay missed updates. Subscription rejections and other errors are logged for diagnosis.

The 60-second timer and Ctrl+C/SIGTERM end this demonstration explicitly. Closing the stream does not cancel orders.

To stop just a user data subscription while keeping a connection, await `unsubscribeUserDataStream(WS_KEY_MAP.mainWSAPI)`. To end all connections owned by this API client, call `disconnectAll()`. A dedicated finite client, as above, can simply close its connections. Remove application timers and signal listeners during shutdown.

[First order](/guides/orders) · [WebSocket API client reference](/api/classes/WebsocketAPIClient) · [Binance subscription methods](https://developers.binance.com/docs/binance-spot-api-docs/websocket-api/user-data-stream-requests)
