---
title: "Subscribe to Bybit private order updates"
description: "Authenticate a Testnet WebSocket, observe order changes and close the connection cleanly."
---

# Subscribe to private order updates

Use `WebsocketClient` to observe changes to your Testnet orders. This example subscribes to `order.linear`, prints selected order fields, and closes after a fixed duration. It does not place or cancel orders.

## Configure the connection

Use Node.js 24 with `bybit-api` installed. Create a private `.env` file with credentials from **Bybit Testnet**, with the account permissions needed to read your orders:

```dotenv
BYBIT_API_KEY=replace_with_your_testnet_key
BYBIT_API_SECRET=replace_with_your_testnet_secret
BYBIT_TESTNET_STREAM=I_UNDERSTAND
BYBIT_STREAM_SECONDS=60
```

Replace both credential placeholders and add `.env` to `.gitignore`. Keep this code server-side. The SDK signs the WebSocket authentication request using the configured key and secret; you do not build the signature yourself.

Save the following as `private-stream.ts`:

<<< @/../examples/private-stream.ts

Run it:

```sh
node --env-file=.env private-stream.ts
```

## Observe an order

Wait for `Private stream authenticated.` and `Subscribed to order.linear.` before starting the [Testnet order example](/guides/orders) in another terminal using the same account. Authentication alone does not confirm a subscription.

Each update prints the order ID, client order ID, symbol, status, cumulative executed quantity, remaining quantity and update time. Match `orderLinkId` to the receipt from your order example. Treat these logs as private account information; the example excludes credentials, signatures and raw request errors.

The stream emits changes, not an initial snapshot of all orders. A quiet stream can be healthy when no orders change. Query REST order state when starting your application rather than waiting for an event to establish existing state.

The subscription uses the category-specific `order.linear` topic. To consume all supported categories, use `order` instead; do not combine it with category-specific order topics in the same subscription request. See Bybit's [private order stream](https://bybit-exchange.github.io/docs/v5/websocket/private/order).

## Handle disconnects and shutdown

The example installs listeners before subscribing and waits for a subscription response. It exits if no acknowledgement arrives within ten seconds, if authentication/subscription fails, or if the connection is interrupted. `BYBIT_STREAM_SECONDS` accepts 5–300 seconds; Ctrl+C also closes the socket and clears timers.

The SDK can reconnect and restore subscriptions, but reconnecting does not recover missed order events. This example stops on interruption so you can reconcile with REST and then restart. Closing the stream does not cancel open orders.

In an application that reconnects automatically, reconcile orders after every interruption. Do not count each message as a new fill: Bybit can emit two `Filled` order updates when a fill races with a cancellation. Track cumulative execution by order ID and use execution records when you need individual fills.

[WebSockets](/guides/websockets) · [Place and cancel an order](/guides/orders) · [Production guidance](/guides/production)
