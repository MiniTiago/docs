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

The `response` listener logs server subscription acknowledgements for `orderUpdates` and `userFills`. A resolved `subscribe()` promise confirms local sending, not server acceptance. Run the [order example](/guides/orders) in another terminal to produce updates.

## Read updates

`orderUpdates` contains an array of order changes. Each entry includes the order ID, coin, status and status timestamp. Use the order ID or `order.cloid` to correlate an update with your client order ID.

`userFills` contains fills and an optional `isSnapshot` flag. The example skips the initial snapshot when printing new fills. In a persistent application, use the snapshot to initialize state and deduplicate later fills using their trade identifiers. Order-status updates and fills describe different events.

A quiet account may produce no new messages. Use REST for existing orders and fills; the stream reports subsequent changes.

See the [subscription payloads](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions) for the complete event fields.

## Disconnect and recover

The SDK automatically reconnects and restores cached subscriptions. The example logs `reconnecting`, `reconnected` and `exception` events without stopping recovery. It closes after 60 seconds or on Ctrl+C/SIGTERM and clears its timer and signal listeners.

After a connection gap, use REST to reconcile order and fill history with streamed updates. `reconnected` reports a restored connection, not a replay of missed events. Closing the stream does not cancel orders.

[WebSocket subscriptions](/guides/websockets) · [Authentication](/guides/authentication) · [Production usage](/guides/production)
