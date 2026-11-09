---
title: "Bybit SDK production usage"
description: "Handle Bybit retries, uncertain order outcomes, stream recovery and shutdown."
---

# Production usage

<!--@include: @/.vitepress/shared/production/request-policy.md-->

## Resolve uncertain order outcomes

Bybit may accept an order before a request times out. If a response returned `orderId`, use it with the category in `getActiveOrders()` and fall back to order history when absent. A filled order may no longer be active.

If no order ID was returned, reconcile realtime orders, history, executions and positions using the original symbol, request time, side, price and quantity before resubmitting. Empty or delayed results alone do not establish that submission failed. Save returned order IDs and track acknowledgement, acceptance and fills separately.

## Recover streaming state

The client reconnects and restores subscriptions. Listen for `reconnect`, `reconnected` and `exception`, and reconcile orders and positions after a connection gap.

Bybit V5 channels have different snapshot and delta semantics. Follow the documentation for each topic instead of treating every update as a complete replacement.

Track feed freshness and finish recovery before using affected data for new orders.

<!--@include: @/.vitepress/shared/production/operations.md-->

[Repository releases](https://github.com/sieblyio/bybit-api/releases) · [Current exchange documentation](https://bybit-exchange.github.io/docs/v5/intro)
