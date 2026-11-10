---
title: "Binance SDK production usage"
description: "Handle Binance retries, uncertain order outcomes, stream recovery and shutdown."
---

# Production usage

<!--@include: @/.vitepress/shared/production/account-state.md-->

<!--@include: @/.vitepress/shared/production/request-policy.md-->

## Resolve uncertain order outcomes

A timeout does not prove that Binance rejected an order. First use matching private order and trade events to determine what happened. If the outcome is still unclear, query `getOrder()` with the symbol and returned `orderId`. If no ID is available, use open orders, order history and trade history for the same account and symbol to resolve the request before submitting again. For derivatives, use the matching futures client's methods.

Save the returned order ID with the account, network and symbol. Track acknowledgement, acceptance and fills separately.

## Recover streaming state

The client reconnects and restores subscriptions automatically. `reconnecting` signals that connection recovery is starting; mark the affected account state as stale. `reconnected` means the socket has reopened and is a useful trigger for REST reconciliation of missed orders, fills, balances and, for futures, positions. Listen for `exception` to diagnose errors.

Authentication and subscription recovery may still be completing when `reconnected` fires. Confirm the required private streams are ready, account for updates received during REST recovery, and reconcile open orders with the current position before making follow-up changes. Do not blindly recreate orders after reconnecting.

For a local order book, follow Binance's documented snapshot and depth-update sequence rules. Reconnecting a socket alone does not rebuild an accurate book.

Track feed freshness and finish recovery before using affected data for new orders.

<!--@include: @/.vitepress/shared/production/operations.md-->

[Repository releases](https://github.com/sieblyio/binance/releases) · [Current exchange documentation](https://developers.binance.com/docs/binance-spot-api-docs)
