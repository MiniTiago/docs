---
title: "Kraken SDK production usage"
description: "Handle Kraken retries, order reconciliation, stream recovery and clean shutdown."
---

# Production usage

<!--@include: @/.vitepress/shared/production/account-state.md-->

<!--@include: @/.vitepress/shared/production/request-policy.md-->

## Resolve uncertain order outcomes

Kraken may accept an order even if the REST request times out. Check the private `executions` stream for the matching order or fill. If those events resolve the outcome, there is no need for a follow-up REST query.

If the response and stream leave the outcome unclear, use `SpotClient.getOrders()` with the exchange order ID. Without an ID, inspect open orders, closed orders and trades for the original pair, request time, side, price and volume. An empty or delayed result alone does not establish that the submission failed. Do not automatically repeat a state-changing request after a transport failure.

Save returned order IDs with the account and pair so you can match later events and recovery queries.

## Recover streaming state

`WebsocketClient` reconnects and restores subscriptions. Listen for `reconnecting`, `reconnected` and `exception`, and let the SDK handle reconnection.

After a gap, confirm the private subscriptions and process their snapshots and updates. Use REST to recover any missing order, execution or balance state, accounting for events received during recovery. Resume dependent actions once the state they need is current.

Market-data channels have their own snapshot, update and checksum rules. Track feed health; an open socket alone does not establish that the data is current.

## Nonces and rate limits

Coordinate private requests that share an API key; independent processes can cause out-of-order nonces. Apply Kraken's REST and trading rate limits across the application, not separately in each worker.

<!--@include: @/.vitepress/shared/production/operations.md-->

[SDK releases](https://github.com/sieblyio/kraken-api/releases) · [Kraken API documentation](https://docs.kraken.com/api/)
