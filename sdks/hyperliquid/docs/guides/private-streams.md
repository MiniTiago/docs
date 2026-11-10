---
title: Subscribe to Hyperliquid account order updates
description: Receive account order changes and fills with WebsocketClient on Mainnet or Testnet.
---

# Subscribe to account order updates

Use `WebsocketClient` to receive `orderUpdates` and `userFills` for a Hyperliquid account. These subscriptions work on Mainnet and Testnet, use the managed account address and do not require a private key or signature.

## Example: connect to Testnet

This example sets `testnet: true`. For production (Mainnet), set `testnet: false` (or omit it) and use the Mainnet account address. Use Node.js 24 with the [`@siebly/hyperliquid-api`](https://www.npmjs.com/package/@siebly/hyperliquid-api) npm package installed. Set the account address in a local `.env` file:

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

`orderUpdates` contains an array of order changes. Each entry includes the order ID, coin, status and status timestamp. Use `order.oid` to correlate an update with the order ID returned when placing the order.

`userFills` contains fills and an optional `isSnapshot` flag. The example skips the initial snapshot when printing new fills. In a persistent application, use the snapshot to initialize state and deduplicate later fills using their trade identifiers. Order-status updates and fills describe different events.

Load existing orders and any state not covered by the stream snapshots at startup. Account for events received during that read, then use WebSocket updates to maintain local state. Do not follow every submission or cancellation with a REST query. A quiet account may produce no new messages.

These two subscriptions cover orders and fills. Add the account-state subscriptions needed for your balances or positions; a fill event alone does not provide a complete account view. See [account state](/guides/production#keep-account-state-up-to-date).

See the [subscription payloads](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions) for the complete event fields.

## Disconnect and recover

The SDK automatically reconnects and restores cached subscriptions. The example logs `reconnecting`, `reconnected` and `exception` events without stopping recovery. It closes after 60 seconds or on Ctrl+C/SIGTERM and clears its timer and signal listeners.

After a connection gap, use REST to reconcile order and fill history with streamed updates. `reconnected` reports a restored connection, not a replay of missed events. Closing the stream does not cancel orders.

[WebSocket subscriptions](/guides/websockets) · [Authentication](/guides/authentication) · [Production usage](/guides/production)
