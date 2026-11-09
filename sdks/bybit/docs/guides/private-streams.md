---
title: "Bybit private account streams"
description: "Subscribe to private account updates with a Testnet order-stream example."
---

# Subscribe to private account updates

Use `WebsocketClient` to receive private account updates, including orders, executions, positions and wallet changes. It supports Mainnet, Testnet and demo trading with credentials and topics supported by the selected environment.

This example uses Testnet and the `order.linear` topic. It prints order changes for 60 seconds without placing or cancelling orders.

## Configure the connection

Mainnet is the default. Use `testnet: true` for Testnet, or `demoTrading: true` with `testnet: false` for demo trading. Use credentials for that environment; see [configuration](/guides/configuration#select-an-environment) for supported features.

Use Node.js 24 with `bybit-api` installed. Create a private `.env` file with credentials from Bybit Testnet, with the account permissions needed to read your orders:

```dotenv
# Use your own Bybit Testnet credentials.
BYBIT_API_KEY=example_testnet_key
BYBIT_API_SECRET=example_testnet_secret
```

Keep `.env` server-side and excluded from version control. Leave `BYBITTRACE` unset to avoid logging signed requests. The SDK signs the WebSocket authentication request.

Save the following as `private-stream.ts`:

<<< @/../examples/private-stream.ts

Run it:

```sh
node --env-file=.env private-stream.ts
```

## Observe an order

Wait for `Private stream authenticated.` and `Subscribed to order.linear.` before starting the [Testnet order example](/guides/orders) in another terminal using the same account. Authentication alone does not confirm a subscription.

Each update prints the exchange order ID, symbol, status, cumulative executed quantity and remaining quantity. Match `orderId` to the ID returned by the order example. Stream and subscription errors are logged with their error objects.

The stream emits changes, not an initial snapshot of all orders. Use REST to retrieve existing state; a quiet stream can simply mean no orders have changed.

The subscription uses the category-specific `order.linear` topic. To consume all supported categories, use `order` instead; do not combine it with category-specific order topics in the same subscription request. See Bybit's [private order stream](https://bybit-exchange.github.io/docs/v5/websocket/private/order).

## Handle disconnects and shutdown

The example runs for 60 seconds, including connection and authentication time. Its timer and Ctrl+C handler close the socket and clear the timer; network errors do not trigger shutdown.

The SDK reconnects, authenticates and restores subscriptions automatically. The example logs `reconnect`, `reconnected`, `close` and error events without interrupting that recovery. A `reconnected` event confirms the connection is open; the subsequent subscription response confirms `order.linear` is subscribed again.

Reconnection does not replay missed order events. Reconcile orders with REST after a gap, then continue processing updates. Closing the stream does not cancel open orders.

Bybit can emit two `Filled` order updates when a fill races with a cancellation. Track cumulative execution by order ID, or use execution records for individual fills.

[WebSockets](/guides/websockets) · [Place and cancel an order](/guides/orders) · [Production guidance](/guides/production)
