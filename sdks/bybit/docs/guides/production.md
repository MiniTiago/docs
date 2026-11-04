---
title: "Bybit SDK production usage"
description: "Handle Bybit retries, uncertain order outcomes, stream recovery and shutdown."
---

# Production usage

<!--@include: @/.vitepress/shared/production/request-policy.md-->

## Resolve uncertain order outcomes

A timeout can occur after an exchange has accepted an order. For order submissions, track your `orderLinkId`. After an uncertain result, query `getActiveOrders()` with the appropriate category and order identifier, then consult order history or executions as needed. A missing result in one query is not proof that the original order never existed.

Persist the identifiers needed for reconciliation before submitting an order. Distinguish a transport acknowledgement, an accepted order and a fill in your application state.

## Recover streaming state

Listen for `reconnect`, `reconnected` and `exception`. The client manages reconnection and remembered subscriptions, but your application must decide when its local state is current again. After a gap, reconcile orders and positions with REST before acting on cached state.

Bybit V5 channels have different snapshot and delta semantics. Follow the documentation for each topic instead of treating every update as a complete replacement.

Record the last update time and mark stale feeds explicitly. Avoid placing new orders based solely on a reconnected event.

<!--@include: @/.vitepress/shared/production/operations.md-->

[Repository releases](https://github.com/sieblyio/bybit-api/releases) · [Current exchange documentation](https://bybit-exchange.github.io/docs/v5/intro)
