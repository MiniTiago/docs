---
title: "Bybit SDK production usage"
description: "Handle Bybit retries, uncertain order outcomes, stream recovery and shutdown."
---

# Production usage

<!--@include: @/.vitepress/shared/production/account-state.md-->

<!--@include: @/.vitepress/shared/production/request-policy.md-->

## Resolve uncertain order outcomes

A timeout does not prove that Bybit rejected an order. Check matching private order and execution events first. If they leave the outcome unclear, use the returned `orderId` and category with `getActiveOrders()`, then use order history when needed. A filled order may no longer be active.

If the outcome is still unknown and no order ID is available, use realtime orders, history, executions and positions for the original symbol, request time, side, price and quantity to resolve it before resubmitting. Empty or delayed results alone do not establish that submission failed. Save returned order IDs and track acknowledgement, acceptance and fills separately.

## Recover streaming state

The client reconnects and restores subscriptions automatically. Bybit uses `reconnect`, not `reconnecting`, to signal that connection recovery is starting; mark the affected account state as stale. `reconnected` means the socket has reopened and is a useful trigger for REST reconciliation of missed orders, executions, positions and wallet state. Listen for `exception` to diagnose errors.

Authentication and subscription recovery may still be completing when `reconnected` fires. Confirm the required private subscriptions are ready, account for updates received during REST recovery, and reconcile open orders with the current position before making follow-up changes. Do not blindly recreate orders after reconnecting.

Bybit V5 channels have different snapshot and delta semantics. Follow the documentation for each topic instead of treating every update as a complete replacement.

Track feed freshness and finish recovery before using affected data for new orders.

<!--@include: @/.vitepress/shared/production/operations.md-->

[Repository releases](https://github.com/sieblyio/bybit-api/releases) · [Current exchange documentation](https://bybit-exchange.github.io/docs/v5/intro)
