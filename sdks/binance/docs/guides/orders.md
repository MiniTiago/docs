---
title: "Place your first Binance Spot Testnet order"
description: "Place, query and cancel a post-only Spot Testnet order using a saved client order ID."
---

# Place your first Spot Testnet order

Use `MainClient` to place one `LIMIT_MAKER` order, query its status and cancel its remaining quantity. Each operation runs separately so you can inspect the result before continuing.

`LIMIT_MAKER` is post-only: Binance rejects it if it would immediately match as a taker. An accepted resting order can still fill, including before you cancel it. This walkthrough uses Spot Testnet and its virtual funds only.

## Set up

Use Node.js 24 and install the SDK in a server-side project:

```sh
npm install binance
```

Create credentials at [Binance Spot Testnet](https://testnet.binance.vision/). Enable the permissions needed to read account state and trade. Use Testnet credentials with this server-side example and keep your system clock synchronized.

Create a local `.env` file, exclude it from version control, and fill in your values:

```dotenv
# Illustrative values; use your own Spot Testnet credentials.
BINANCE_TESTNET_API_KEY=example_testnet_key
BINANCE_TESTNET_API_SECRET=example_testnet_secret
BINANCE_CLIENT_ORDER_ID=docs-btc-buy-001 # Unique for each new order
BINANCE_ORDER_ID= # Fill with the exchange order ID after placement
BINANCE_SYMBOL=BTCUSDT # Spot market
BINANCE_PRICE=60000 # Example USDT limit price; choose for the current market
BINANCE_QUANTITY=0.001 # BTC
```

Choose a buy price below the current best ask and a quantity that fits your Testnet balance. Check the symbol's price increment, quantity increment and minimum order value using [exchange information](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints#exchange-information). Binance validates these rules at submission.

Choose a unique `BINANCE_CLIENT_ORDER_ID` of at most 36 letters, digits, hyphens or underscores. It identifies the submission if the response is lost. Leave `BINANCE_ORDER_ID` empty initially; save the exchange's returned `orderId` there after placement or a successful status query.

## Save the example

Save this as `first-order.ts`. Node.js 24 can run it directly:

<<< @/../examples/first-order.ts

The example uses the SDK's numeric price and quantity fields and a post-only buy order. It makes one request per command, with no automatic retries, polling or cancellation.

## Place, query and cancel

First place the order:

```sh
node --env-file=.env first-order.ts place
```

The script prints the exchange order ID. Save it as `BINANCE_ORDER_ID` in `.env` for status and cancellation. Use the same Testnet account and symbol throughout.

Submission acknowledgement means Binance accepted the request, not that the order filled. A resting order normally reports `NEW`; an order that has traded may report `PARTIALLY_FILLED` or `FILLED`.

Query the order. If the exchange order ID is not yet known, `status` looks it up using `BINANCE_CLIENT_ORDER_ID`:

```sh
node --env-file=.env first-order.ts status
```

After saving `BINANCE_ORDER_ID`, cancel any remaining quantity:

```sh
node --env-file=.env first-order.ts cancel
```

After `cancel`, run `status` again to confirm the outcome. The exchange order ID stays stable; cancellation may change the client order ID. Expect `CANCELED` if cancellation wins the race with execution. `FILLED` means there is nothing left to cancel. A canceled order may still have a nonzero executed quantity from earlier partial fills; cancellation does not reverse those trades.

## Resolve failed or interrupted requests

A post-only rejection can mean the price would immediately trade. Other rejections can indicate filters, funds or permissions. A timeout or lost response can also happen after Binance accepts the order. The example does not automatically retry writes or log raw signed-request errors.

Use `status` with the saved exchange order ID, or the original client order ID if placement did not return one. An unavailable or not-found response does not establish whether the order was accepted. Reconcile open orders and trade history before submitting again. Use a new client order ID and clear `BINANCE_ORDER_ID` when starting a new order.

A connection failure or process exit does not cancel an open order. Keep the saved identifiers for subsequent `status` and `cancel` commands. Testnet resets can remove account and order history; see [Spot Testnet information](https://developers.binance.com/docs/binance-spot-api-docs/testnet).

[Private order updates](/guides/private-streams) · [Order recovery](/guides/production#resolve-uncertain-order-outcomes) · [Trading endpoints](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/trading-endpoints) · [Symbol filters](https://developers.binance.com/docs/binance-spot-api-docs/filters)
