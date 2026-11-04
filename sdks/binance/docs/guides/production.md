---
title: "Binance SDK production usage"
description: "Handle Binance retries, uncertain order outcomes, stream recovery and shutdown."
---

# Production usage

<!--@include: @/.vitepress/shared/production/request-policy.md-->

## Resolve uncertain order outcomes

Binance may accept an order before a request times out. For Spot, query `getOrder()` with the symbol and `origClientOrderId` (the submitted `newClientOrderId`) or `orderId` before resubmitting. Check fills as needed. For derivatives, use the matching futures client's query methods.

Save order identifiers before submission. Track acknowledgement, acceptance and fills separately.

## Recover streaming state

The client reconnects and restores subscriptions. Listen for `reconnecting`, `reconnected` and `exception`, and reconcile orders and balances after a connection gap.

For a local order book, follow Binance's documented snapshot and depth-update sequence rules. Reconnecting a socket alone does not rebuild an accurate book.

Track feed freshness and finish recovery before using affected data for new orders.

<!--@include: @/.vitepress/shared/production/operations.md-->

[Repository releases](https://github.com/sieblyio/binance/releases) · [Current exchange documentation](https://developers.binance.com/docs/binance-spot-api-docs)
