---
title: "Binance SDK production usage"
description: "Handle Binance retries, uncertain order outcomes, stream recovery and shutdown."
---

# Production usage

<!--@include: @/.vitepress/shared/production/request-policy.md-->

## Resolve uncertain order outcomes

Binance may accept an order before a request times out. For Spot, query `getOrder()` with the symbol and returned `orderId` when available. If the placement response was lost and no order ID was saved, reconcile open orders, order history and trade history for the same account and symbol before submitting again. For derivatives, use the matching futures client's query methods.

Save the returned order ID with the account, network and symbol. Track acknowledgement, acceptance and fills separately.

## Recover streaming state

The client reconnects and restores subscriptions. Listen for `reconnecting`, `reconnected` and `exception`, and reconcile orders and balances after a connection gap.

For a local order book, follow Binance's documented snapshot and depth-update sequence rules. Reconnecting a socket alone does not rebuild an accurate book.

Track feed freshness and finish recovery before using affected data for new orders.

<!--@include: @/.vitepress/shared/production/operations.md-->

[Repository releases](https://github.com/sieblyio/binance/releases) · [Current exchange documentation](https://developers.binance.com/docs/binance-spot-api-docs)
