---
title: "Place your first Binance Spot Testnet order"
description: "Place, query and cancel a post-only Spot Testnet order with a durable client order ID."
---

# Place your first Spot Testnet order

Use `MainClient` to place one `LIMIT_MAKER` order, query its status and cancel its remaining quantity. Each operation runs separately so you can inspect the result before continuing.

`LIMIT_MAKER` is post-only: Binance rejects it if it would immediately match as a taker. An accepted resting order can still fill, including before you cancel it. This walkthrough uses Spot Testnet and its virtual funds only.

## Set up

Use Node.js 24 and install the SDK in a server-side project:

```sh
npm install binance
```

Create credentials at [Binance Spot Testnet](https://testnet.binance.vision/). Enable the permissions needed to read account state and trade. Use Testnet credentials only, keep your system clock synchronized, and never expose signing credentials in browser code.

Create a local `.env` file, exclude it from version control, and fill in your values:

```dotenv
BINANCE_TESTNET=true
BINANCE_TESTNET_API_KEY=your_testnet_api_key
BINANCE_TESTNET_API_SECRET=your_testnet_api_secret
BINANCE_ORDER_RECEIPT=./spot-testnet-order.json
BINANCE_SYMBOL=BTCUSDT
BINANCE_SIDE=BUY
BINANCE_PRICE=YOUR_LIMIT_PRICE
BINANCE_QUANTITY=YOUR_BASE_ASSET_QUANTITY
```

Choose the price and quantity yourself using the current Testnet market and available balance. Replace both placeholders with positive decimal strings, without commas or scientific notation. For a buy, select a price below the best ask; for a sell, select a price above the best bid. Prices can move before the request arrives. Very distant prices may violate percentage-price filters.

## Save the example

Save this as `first-order.ts`. Node.js 24 can run it directly:

<<< @/../examples/first-order.ts

The example fetches current exchange information and checks trading status, order type, price increments, quantity increments and minimum/maximum notional. It does not round your inputs. Binance also enforces dynamic percentage-price filters, account balances, permissions and order-count limits at submission time.

Calculations use scaled integers, preserving up to 18 decimal places. The SDK's order fields are typed as numbers; the two type assertions preserve the decimal strings sent on the wire without converting them to floating-point numbers. Response beautification stays disabled.

## Place, query and cancel

First place the order:

```sh
node --env-file=.env first-order.ts place
```

Before submission, the script exclusively creates a receipt containing the Testnet environment, symbol and client order ID. An existing receipt prevents another submission. Use the same Testnet account credentials for all three commands. Keep the receipt even if submission fails or the process is interrupted. Do not delete it just to rerun `place`.

After acknowledgement, the script queries the order. A resting order normally reports `NEW`; an order that has traded may report `PARTIALLY_FILLED` or `FILLED`. Acknowledgement alone does not mean it filled.

Query the same order at any time:

```sh
node --env-file=.env first-order.ts status
```

Cancel any remaining quantity:

```sh
node --env-file=.env first-order.ts cancel
```

Cancellation checks status first, sends at most one cancel request and queries the result up to three times. Expect `CANCELED` if cancellation wins the race with execution. `FILLED` means there is nothing left to cancel. A canceled order may still have a nonzero executed quantity from earlier partial fills; cancellation does not reverse those trades.

## Resolve failed or interrupted requests

A post-only rejection can mean the price would immediately trade. Other rejections can indicate filters, funds or permissions. A timeout or lost response can also happen after Binance accepts the order. The script never retries a write automatically and does not log raw errors, request URLs or credentials.

Use `status` with the original receipt to resolve the outcome. An unavailable or not-found response alone is not proof that an uncertain submission failed. Check the Testnet account's open orders and trade history before deciding whether to submit another order. Only choose a new receipt path for a deliberately new order after reconciling the previous attempt.

A connection failure or process exit does not cancel an open order. Keep the receipt available for subsequent `status` and `cancel` commands. Testnet resets can remove account and order history; see [Spot Testnet information](https://developers.binance.com/docs/binance-spot-api-docs/testnet).

[Private order updates](/guides/private-streams) · [Order recovery](/guides/production#resolve-uncertain-order-outcomes) · [Trading endpoints](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/trading-endpoints) · [Symbol filters](https://developers.binance.com/docs/binance-spot-api-docs/filters)
