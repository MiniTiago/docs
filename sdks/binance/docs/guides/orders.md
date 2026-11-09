---
title: "Place your first Binance Spot Testnet order"
description: "Place, query and cancel a post-only Spot Testnet order using the returned order ID."
---

# Place your first Spot Testnet order

Use `MainClient` to place one `LIMIT_MAKER` order, query its status and cancel its remaining quantity. Each operation runs separately so you can inspect the result before continuing.

`LIMIT_MAKER` is post-only: Binance rejects it if it would immediately match as a taker. An accepted resting order can still fill, including before you cancel it.

This walkthrough uses Spot Testnet and virtual funds to avoid accidental live trades. The same Spot methods work on Mainnet, Binance's production markets. Remove `testnet` or set it to `false`, and use production credentials to execute against live markets.

## Set up

Use Node.js 24 and install the SDK in a server-side project:

```sh
npm install binance
```

To run this example on Spot Testnet, create credentials at [Binance Spot Testnet](https://testnet.binance.vision/). Enable the permissions needed to read account state and trade. Use Testnet credentials with this server-side example and keep your system clock synchronized.

Create a local `.env` file, exclude it from version control, and fill in your values:

```dotenv
# Illustrative values; use your own Spot Testnet credentials.
BINANCE_TESTNET_API_KEY=example_testnet_key
BINANCE_TESTNET_API_SECRET=example_testnet_secret
BINANCE_SYMBOL=BTCUSDT # Spot market
BINANCE_PRICE=60000 # Example USDT limit price; choose for the current market
BINANCE_QUANTITY=0.001 # BTC
```

Choose a buy price below the current best ask and a quantity that fits your Testnet balance. Check the symbol's price increment, quantity increment and minimum order value using [exchange information](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints#exchange-information). Binance validates these rules at submission.

A custom client order ID is optional and is not needed for this example. Status and cancellation use the exchange order ID returned after placement.

## Save the example

Save this as `first-order.ts`. Node.js 24 can run it directly:

<<< @/../examples/first-order.ts

The example uses the SDK's numeric price and quantity fields and a post-only buy order. It makes one request per command, with no automatic retries, polling or cancellation.

## Place, query and cancel

First place the order:

```sh
node --env-file=.env first-order.ts place
```

The script prints the exchange order ID. Save it in `.env` for status and cancellation:

```dotenv
BINANCE_ORDER_ID=123456789 # Use the returned orderId
```

Use the same Testnet account and symbol throughout.

Submission acknowledgement means Binance accepted the request, not that the order filled. A resting order normally reports `NEW`; an order that has traded may report `PARTIALLY_FILLED` or `FILLED`.

Query the order using the saved `BINANCE_ORDER_ID`:

```sh
node --env-file=.env first-order.ts status
```

After saving `BINANCE_ORDER_ID`, cancel any remaining quantity:

```sh
node --env-file=.env first-order.ts cancel
```

After `cancel`, run `status` again to confirm the outcome. Use the same exchange order ID throughout. Expect `CANCELED` if cancellation wins the race with execution. `FILLED` means there is nothing left to cancel. A canceled order may still have a nonzero executed quantity from earlier partial fills; cancellation does not reverse those trades.

## Resolve failed or interrupted requests

A post-only rejection can mean the price would immediately trade. Other rejections can indicate filters, funds or permissions. A timeout or lost response can also happen after Binance accepts the order. The example logs the error object and does not automatically retry writes.

If you have the exchange order ID, use `status`. If the placement response was lost and no ID was saved, inspect open orders, order history and trade history for the same account and symbol before submitting again. An unavailable or not-found response does not establish whether the order was accepted. Save the confirmed order ID for subsequent status and cancellation commands.

A connection failure or process exit does not cancel an open order. Keep the saved identifiers for subsequent `status` and `cancel` commands. Testnet resets can remove account and order history; see [Spot Testnet information](https://developers.binance.com/docs/binance-spot-api-docs/testnet).

[Private order updates](/guides/private-streams) · [Order recovery](/guides/production#resolve-uncertain-order-outcomes) · [Trading endpoints](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/trading-endpoints) · [Symbol filters](https://developers.binance.com/docs/binance-spot-api-docs/filters)
