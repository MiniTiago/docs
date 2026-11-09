---
title: "Kraken private account updates"
description: "Observe Kraken Spot order and trade updates using authenticated WebSocket subscriptions."
---

# Private account updates

Use `WebsocketClient` to observe account changes. The Spot v2 `executions` channel delivers order status and execution updates. Other private channels cover account balances; Futures has its own private feeds.

## Observe Spot executions

Use the [Spot credentials setup](/guides/authentication), with WebSocket access enabled and the order/trade query permissions required by the channel. This example only subscribes to account updates; it does not place orders.

Save this as `private-stream.ts` and run `node --env-file=.env private-stream.ts` with Node.js 24:

<<< @/../examples/private-stream.ts

The SDK obtains and manages the Spot WebSocket authentication token. Do not fetch or inject a token manually for this subscription.

## Interpret updates

The channel sends snapshots and subsequent updates. Read the event's execution type and order status when updating application state; a successful subscription or authentication reply is not an order acknowledgement.

The example logs all messages for inspection, including messages your application does not yet handle. Follow the [executions channel schema](https://docs.kraken.com/api/docs/websocket-v2/executions/) when adding typed handlers.

## Recover after a gap

The client reconnects and resubscribes. Reconcile orders and executions after a disconnect before relying on local state for new decisions. A reconnect event alone does not prove your application has accounted for every fill.

[Production usage](/guides/production) · [WebsocketClient reference](/api/classes/WebsocketClient)
