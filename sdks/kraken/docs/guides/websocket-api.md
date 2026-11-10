---
title: "Kraken WebSocket API requests"
description: "Use awaitable Kraken WebSocket API operations and distinguish requests from streaming subscriptions."
---

# WebSocket API requests

`WebsocketAPIClient` exposes awaitable Kraken **Spot** WebSocket API operations. It is not a Futures WebSocket request client. Check the [client reference](/api/classes/WebsocketAPIClient) for supported operations.

<!--@include: @/.vitepress/shared/clients/awaitable-websocket.md-->

## Requests and subscriptions

A request returns one result. Use [public streams](/guides/websockets) for continuous market data and [account updates](/guides/private-streams) to follow account and order changes. Request responses do not replace these subscriptions.

Use the [account access guide](/guides/authentication) for credentials and permissions before making authenticated requests. For order submissions, keep account updates connected and follow the [order management workflow](/guides/orders).

## Recover an uncertain outcome

A connection can fail after an exchange processes a request but before the response arrives. Follow [account updates](/guides/private-streams) and [reconcile uncertain outcomes](/guides/production#resolve-uncertain-order-outcomes) before retrying an order.
