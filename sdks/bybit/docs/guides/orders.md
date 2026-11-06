---
title: "Place and cancel a Bybit Testnet order"
description: "Submit a PostOnly limit order, query its status and cancel its remaining quantity."
---

# Place and cancel a Testnet order

Create one BTCUSDT perpetual limit order, find it by your client order ID, then cancel any unfilled quantity. The example uses **Bybit Testnet only** and never submits a market order.

## Before you start

- Use Node.js 24 and install `bybit-api` with `npm install bybit-api`.
- Create Testnet API credentials with derivatives trading and account-read permissions. Fund the Testnet account with test assets.
- Use a Unified Trading Account with BTCUSDT in **one-way position mode** (`positionIdx: 0`). This example does not change your account's position mode or leverage.
- Keep credentials in a private `.env` file, outside source control. Run on your server or development machine, never in a browser.

A PostOnly order is cancelled if it would immediately take liquidity. If it rests on the book, it **can still fill** before cancellation. A fill changes your Testnet position; cancelling the remaining quantity does not close that position.

## Choose price and quantity

Use the Testnet BTCUSDT market to choose a buy price below the current best bid. Set a quantity in BTC and a maximum order notional in USDT. There are no default order values.

```dotenv
BYBIT_API_KEY=replace_with_your_testnet_key
BYBIT_API_SECRET=replace_with_your_testnet_secret
BYBIT_TESTNET_ORDERS=I_UNDERSTAND
BYBIT_LIMIT_PRICE=replace_with_your_limit_price
BYBIT_ORDER_QTY=replace_with_your_btc_quantity
BYBIT_MAX_NOTIONAL_USDT=replace_with_your_notional_cap
```

Replace every placeholder before running. The example checks `priceFilter.tickSize`, `lotSizeFilter.qtyStep`, price and quantity bounds, and `minNotionalValue` from [`getInstrumentsInfo()`](/api/classes/RestClientV5#getinstrumentsinfo). It compares decimal strings with integer arithmetic rather than floating-point rounding. Choose values that already match the filters; the example never rounds up your quantity or increases your cap.

The cap applies to `price × quantity`, not account margin, fees or future position losses. Bybit also checks margin, account settings and dynamic price limits when it receives the order. Passing local validation does not guarantee acceptance.

## Submit, query and cancel

Save the following as `first-order.ts`:

<<< @/../examples/first-order.ts

Run it from a private working directory:

```sh
node --env-file=.env first-order.ts
```

The example performs these steps:

1. Validates your opt-in, credentials, decimal inputs and current instrument filters.
2. Saves a unique `orderLinkId` and the order parameters to `bybit-testnet-order.json` before sending anything. An existing receipt prevents a second submission.
3. Sends one `Limit` / `PostOnly` buy order with [`submitOrder()`](/api/classes/RestClientV5#submitorder).
4. Reads its status with [`getActiveOrders()`](/api/classes/RestClientV5#getactiveorders), falling back to [`getHistoricOrders()`](/api/classes/RestClientV5#gethistoricorders) when necessary.
5. Requests cancellation once if the order is `New` or `PartiallyFilled`, then continues checking for a terminal status.

A typical run prints a saved client ID, submission acknowledgement, a `New` status, cancellation response code `0`, then `Cancelled`. It may instead report `Filled`, `Rejected` or another terminal status. Inspect `cumExecQty` even when the final status is `Cancelled`: part of the order may have filled.

Submission and cancellation responses acknowledge requests; they do not confirm the final order state. See Bybit's [create-order](https://bybit-exchange.github.io/docs/v5/order/create-order) and [cancel-order](https://bybit-exchange.github.io/docs/v5/order/cancel-order) contracts. Run the [private order stream](/guides/private-streams) in a second terminal to observe updates alongside the REST queries.

## Recover an interrupted run

Keep the receipt until you have resolved the order and any fills. Add the receipt filename to `.gitignore`.

If submission or cancellation times out, the request may already have reached Bybit. The example never resubmits the order. It makes up to ten status checks, with a one-second interval and a ten-second timeout per REST request, then exits with a nonzero status if the outcome remains unresolved. An empty query result does not prove the order was never created.

To resume from the saved ID, change the mode in `.env` and rerun:

```dotenv
BYBIT_ORDER_MODE=recover
```

Recovery does not submit an order or require price/quantity inputs. It queries the saved ID and makes at most one cancellation attempt if an open order is found. Use it after the preceding process has stopped, not concurrently. If a previous cancellation had an uncertain result, recovery reads the current state before deciding whether to cancel again.

For unresolved orders, inspect the same ID in Testnet order history and review your positions. Recent closed orders can disappear from the realtime endpoint after a service restart, and history can lag; see [open and closed orders](https://bybit-exchange.github.io/docs/v5/order/open-order). Do not delete the receipt merely because a query returned no records.

After confirming the order is terminal and handling any Testnet position, archive the receipt and remove `BYBIT_ORDER_MODE=recover` before starting another deliberate test. Stopping the process or closing a WebSocket does not cancel an order. The example does not automatically close filled positions.

[Authentication](/guides/authentication) · [Private order stream](/guides/private-streams) · [Error handling](/guides/errors)
