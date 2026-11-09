---
title: "Validate a Kraken Spot order"
description: "Validate a Kraken Spot limit order without placing it, and understand returned order IDs and uncertain outcomes."
---

# Validate a Spot order

Kraken Spot has no public testnet, and the Futures demo environment has been retired. This example uses Spot's `validate: true` option: Kraken checks the request without submitting an order to the market.

Validation is not a fill simulation. It does not establish what price, liquidity or account state will be available for a later live order.

## Prepare the request

Use the [authentication setup](/guides/authentication) with a Spot key permitted to create orders. Choose a pair, price and volume suitable for your account, using [`getAssetPairs()`](/api/classes/SpotClient#getassetpairs) for current precision and minimums.

Add a price and volume to your private `.env` file. These are illustrative, not a trading recommendation:

```dotenv
KRAKEN_ORDER_PRICE=50000 # Limit price in USD for XBTUSD
KRAKEN_ORDER_VOLUME=0.0002 # Amount of BTC
```

Save this as `validate-order.ts` in a TypeScript project:

<<< @/../examples/validate-order.ts

Run it with Node.js 24:

```sh
node --env-file=.env validate-order.ts
```

A successful response prints the validation result. Validation does not create an order to query or cancel.

## Live order lifecycle

For a live order, `submitOrder()` accepts the same parameters with `validate` omitted or false. That sends an actual order to Kraken's production market. Save the exchange-returned `result.txid` values, use [`getOrders({ txid })`](/api/classes/SpotClient#getorders) to query an order, and [`cancelOrder({ txid })`](/api/classes/SpotClient#cancelorder) to request cancellation.

A cancellation request can race with a fill. Query the order or consume [private execution updates](/guides/private-streams) to determine its final state.

If a submission times out before returning an ID, reconcile open orders, closed orders and executions before retrying. An absent or delayed response is not proof that the order was rejected. See [Production usage](/guides/production#resolve-uncertain-order-outcomes).
