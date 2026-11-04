---
title: "Binance SDK production usage"
description: "Handle Binance retries, uncertain order outcomes, stream recovery and shutdown."
---

# Production usage

<!--@include: @/.vitepress/shared/production/request-policy.md-->

## Resolve uncertain order outcomes

A timeout can occur after an exchange has accepted an order. For Spot orders, track your `newClientOrderId`. After a timeout, query `getOrder()` using the symbol and `origClientOrderId` or `orderId`, then reconcile fills if needed. Use the matching futures client's query methods for derivatives. Do not treat every order endpoint as safe to repeat.

Persist the identifiers needed for reconciliation before submitting an order. Distinguish a transport acknowledgement, an accepted order and a fill in your application state.

## Recover streaming state

Listen for `reconnecting`, `reconnected` and `exception`. The client manages reconnection and remembered subscriptions. Application state can still be stale after a connection gap; reconcile orders and balances before acting on cached values.

For a local order book, follow Binance's documented snapshot and depth-update sequence rules. Reconnecting a socket alone does not rebuild an accurate book.

Record the last update time and mark stale feeds explicitly. Avoid placing new orders based solely on a reconnected event.

<!--@include: @/.vitepress/shared/production/operations.md-->

[Repository releases](https://github.com/sieblyio/binance/releases) · [Current exchange documentation](https://developers.binance.com/docs/binance-spot-api-docs)
