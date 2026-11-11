---
title: "Coinbase SDK production usage"
description: "Manage Coinbase account state, reconnection, uncertain orders and operational safety."
---

# Production usage

<!--@include: @/.vitepress/shared/production/account-state.md-->

For Advanced Trade, the `user` feed principally supplies order state. Load balances, positions and any other fields not covered by the selected feed separately. Only apply position-triggered logic from a position source that actually covers your product.

<!--@include: @/.vitepress/shared/production/request-policy.md-->

## Resolve uncertain order outcomes

Persist the client order ID before submission and the exchange order ID when returned. Inspect the response for business errors. Then let the private stream track order changes. If a timeout or disconnect leaves the outcome unresolved, reconcile the original request with `getOrder()`, `getOrders()` and `getFills()` as appropriate; do not blindly recreate it.

Follow pagination. An empty first page or a delayed stream message does not prove that an order was never accepted.

## Recover streaming state

`reconnect` signals recovery starting; mark affected state stale. `reconnected` signals a reopened socket and can trigger reconciliation, but does not establish that subscriptions, authentication or account recovery have completed.

The SDK reconnects and resubscribes cached topics. Confirm required subscriptions and snapshots, repair gaps with REST, and account for events received while that repair runs. Resume dependent actions only after the relevant state is current. Never assume missed updates are replayed in full.

Use channel-specific sequence and snapshot rules for market data. Heartbeats show activity, not the correctness of a reconstructed book. A quiet order feed may simply mean no orders changed.

## Account and rate-limit boundaries

Apply request budgets across workers sharing an account or key. Coinbase limits vary by API family and endpoint. Keep system clocks synchronized for signing, validate permissions on startup, and separate credentials for different products and environments.

<!--@include: @/.vitepress/shared/production/operations.md-->

[SDK releases](https://github.com/tiagosiebler/coinbase-api/releases) · [Coinbase developer documentation](https://docs.cdp.coinbase.com/)
