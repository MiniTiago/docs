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

For a live order, `submitOrder()` accepts the same parameters with `validate` omitted or false. That sends an actual order to Kraken's production market. Connect the [private execution stream](/guides/private-streams) before submitting and confirm the subscription. Save the exchange-returned `result.txid` values and use matching execution events to track order changes and fills. Use [`cancelOrder({ txid })`](/api/classes/SpotClient#cancelorder) to request cancellation.

A cancellation request can race with a fill. Follow private execution updates to determine the resulting state. Subscribe to balance updates too when your application needs them. A successful REST response can provide useful immediate information, but it does not replace ongoing account events.

If the REST response and private events leave an outcome unclear, use [`getOrders({ txid })`](/api/classes/SpotClient#getorders) for a targeted read. If no ID is available, inspect open orders, closed orders and executions before retrying. An absent or delayed response is not proof that the order was rejected. REST reads are a recovery tool here, not a follow-up to every order. See [Production usage](/guides/production#resolve-uncertain-order-outcomes).
