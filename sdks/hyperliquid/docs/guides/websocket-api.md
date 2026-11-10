---
title: "Hyperliquid WebSocket API requests"
description: "Use awaitable Hyperliquid WebSocket API operations and distinguish requests from streaming subscriptions."
---

# WebSocket API requests

`WebsocketAPIClient` extends `RestClient` and sends the same methods through Hyperliquid's WebSocket POST protocol. Public queries do not require a signer; exchange actions still require the [appropriate signer](/guides/authentication).

<!--@include: @/.vitepress/shared/clients/awaitable-websocket.md-->

## Make a request

<<< @/../examples/ws-request.ts

The first request opens the connection. Close the client when finished.

## Requests and subscriptions

A request returns one result. Use [public streams](/guides/websockets) for continuous market data and [account updates](/guides/private-streams) to follow account and order changes. Request responses do not replace these subscriptions.

Use the [account access guide](/guides/authentication) to distinguish unsigned account reads from signed trading actions. For order submissions, keep account updates connected and follow the [order management workflow](/guides/orders).

## Recover an uncertain outcome

A connection can fail after an exchange processes a request but before the response arrives. Follow [account updates](/guides/private-streams) and [reconcile uncertain outcomes](/guides/production#resolve-uncertain-order-outcomes) before retrying an order.
