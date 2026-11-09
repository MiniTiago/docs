---
title: "Kraken SDK production usage"
description: "Handle Kraken retries, order reconciliation, stream recovery and clean shutdown."
---

# Production usage

<!--@include: @/.vitepress/shared/production/request-policy.md-->

## Resolve uncertain order outcomes

A timeout can occur after Kraken accepted an order. When you have the exchange's order ID, query it with `SpotClient.getOrders()` and reconcile order status and executions before deciding what to do next.

If no ID was returned, inspect open orders, closed orders and trades using the original pair, request time, side, price and volume. An empty or delayed result alone does not establish that the submission failed. Do not automatically repeat a state-changing request after a transport failure.

Persist exchange-returned IDs and distinguish request acknowledgement, active orders, fills and cancellation results.

## Recover streaming state

`WebsocketClient` reconnects and restores subscriptions. Listen for `reconnecting`, `reconnected` and `exception` without treating a recoverable disconnect as a fatal process error.

After a gap, reconcile account state before using it for new orders. Market-data channels have their own snapshot, update and checksum rules. Track feed freshness rather than assuming an open socket means the data is current.

## Nonces and rate limits

Coordinate private requests that share an API key; independent processes can cause out-of-order nonces. Apply Kraken's REST and trading rate limits across the application, not separately in each worker.

<!--@include: @/.vitepress/shared/production/operations.md-->

[SDK releases](https://github.com/sieblyio/kraken-api/releases) · [Kraken API documentation](https://docs.kraken.com/api/)
