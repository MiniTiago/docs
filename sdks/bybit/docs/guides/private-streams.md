---
title: "Subscribe to Bybit private order updates"
description: "Authenticate a Testnet WebSocket, observe order changes and close the connection cleanly."
---

# Subscribe to private order updates

Use `WebsocketClient` to observe changes to your Testnet orders. This example subscribes to `order.linear`, prints selected order fields, and closes after a fixed duration. It does not place or cancel orders.

## Configure the connection

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

Each update prints the client order ID, symbol, status, cumulative executed quantity and remaining quantity. Match `orderLinkId` to `BYBIT_ORDER_ID` from your order example. The example logs account data but excludes credentials, signatures and raw request errors.

The stream emits changes, not an initial snapshot of all orders. Use REST to retrieve existing state; a quiet stream can simply mean no orders have changed.

The subscription uses the category-specific `order.linear` topic. To consume all supported categories, use `order` instead; do not combine it with category-specific order topics in the same subscription request. See Bybit's [private order stream](https://bybit-exchange.github.io/docs/v5/websocket/private/order).

## Handle disconnects and shutdown

The example installs listeners before subscribing and waits for a subscription response. It runs for up to 60 seconds, including connection and authentication time, and reports an error if no subscription was confirmed. It stops sooner if authentication/subscription fails or the connection is interrupted. Ctrl+C also closes the socket and clears the timer.

The SDK can reconnect and restore subscriptions, but reconnecting does not recover missed order events. This example stops on interruption so you can reconcile with REST and then restart. Closing the stream does not cancel open orders.

In an application that reconnects automatically, reconcile orders after every interruption. Bybit can emit two `Filled` order updates when a fill races with a cancellation. Track cumulative execution by order ID, or use execution records for individual fills.

[WebSockets](/guides/websockets) · [Place and cancel an order](/guides/orders) · [Production guidance](/guides/production)
