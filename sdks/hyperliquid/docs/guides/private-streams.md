---
title: Subscribe to Hyperliquid account order updates
description: Receive order changes and fills for a Testnet account with WebsocketClient.
---

# Subscribe to account order updates

Use `WebsocketClient` to receive `orderUpdates` and `userFills` for a Hyperliquid account. These subscriptions use the managed account address and do not require a private key or signature.

## Connect to Testnet

Use Node.js 24 with `@siebly/hyperliquid-api` installed. Set the account address in a local `.env` file:

```dotenv
HYPERLIQUID_ACCOUNT_ADDRESS=0x1111111111111111111111111111111111111111 # Use your managed account address
```

Save this as `account-stream.ts`:

<<< @/../examples/private-stream.ts

Run it in a terminal:

```sh
node --env-file=.env account-stream.ts
```

Wait for `Subscribed to order updates and fills.` before running the [order example](/guides/orders) in another terminal. The script waits for both server acknowledgements; a resolved `subscribe()` promise only confirms that the request was sent locally.

## Read updates

`orderUpdates` contains an array of order changes. Each entry includes the order ID, coin, status and status timestamp. Use the order ID or `order.cloid` to correlate an update with your client order ID.

`userFills` contains fills and an optional `isSnapshot` flag. The example skips the initial snapshot when printing new fills. In a persistent application, use the snapshot to initialize state and deduplicate later fills using their trade identifiers. Order-status updates and fills describe different events.

A quiet account may produce no new messages. Use REST for existing orders and fills; the stream reports subsequent changes.

See the [subscription payloads](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions) for the complete event fields.

## Disconnect and recover

The example closes after 60 seconds, on Ctrl+C/SIGTERM, on an exception, or when reconnection begins. It clears its timer and signal listeners and closes late subscription setup. Closing the stream does not cancel orders.

For a long-running application, the SDK reconnects and restores subscriptions by default. After a gap, reload order and fill history and reconcile it with buffered updates before using the stream to make trading decisions. A restored subscription does not replay every missed event.

[WebSocket subscriptions](/guides/websockets) · [Authentication](/guides/authentication) · [Production usage](/guides/production)
