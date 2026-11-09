---
title: "Place and cancel a Bybit Testnet order"
description: "Submit a PostOnly limit order, query its status and cancel its remaining quantity."
---

# Place and cancel a Testnet order

Use `RestClientV5` to place one BTCUSDT perpetual limit order, query it by the returned order ID and cancel any unfilled quantity. Each command runs separately.

This walkthrough uses Bybit Testnet and test funds to avoid accidental live trades. The same methods work on Mainnet, Bybit's production markets. Remove `testnet` or set it to `false`, leave `demoTrading` disabled and use Mainnet credentials to execute against live markets.

## Before you start

- Use Node.js 24 and install the SDK with `npm install bybit-api`.
- To run this example on Testnet, create Bybit Testnet credentials with derivatives trading and account-read permissions, and fund the Testnet account with test assets.
- Use a Unified Trading Account with BTCUSDT in one-way position mode (`positionIdx: 0`). The example does not change your account's position mode or leverage.
- Use a private `.env` file excluded from version control for local development, and a secure server-side environment for deployment. Leave `BYBITTRACE` unset to avoid logging signed requests.

A PostOnly order is cancelled if it would immediately take liquidity. A resting order can fill before cancellation. Cancelling the remaining quantity does not close a position created by a fill.

## Configure the order

Create a `.env` file:

```dotenv
# Use your own Bybit Testnet credentials.
BYBIT_API_KEY=example_testnet_key
BYBIT_API_SECRET=example_testnet_secret
BYBIT_LIMIT_PRICE=60000 # Illustrative USDT price; choose for the current market.
BYBIT_ORDER_QTY=0.001 # Illustrative BTC quantity; current symbol filters apply.
```

Set the buy price below the current Testnet BTCUSDT best bid and specify quantity in BTC. Use decimal strings that satisfy the current price increments, quantity increments and minimum order value from [`getInstrumentsInfo()`](/api/classes/RestClientV5#getinstrumentsinfo). This example sends your values unchanged; Bybit validates them, account margin and dynamic price limits. Prices can move before submission.

## Place, query and cancel

Save this as `first-order.ts`:

<<< @/../examples/first-order.ts

Place the order:

```sh
node --env-file=.env first-order.ts place
```

The response supplies `orderId`. Copy the ID printed by the script into `.env` before running `status` or `cancel`:

```dotenv
BYBIT_ORDER_ID=a1b2c3d4-5678-4abc-9def-0123456789ab # Use the returned orderId.
```

Query the same order:

```sh
node --env-file=.env first-order.ts status
```

The status command reads [`getActiveOrders()`](/api/classes/RestClientV5#getactiveorders), then [`getHistoricOrders()`](/api/classes/RestClientV5#gethistoricorders) if the order is absent. Inspect `orderStatus`, `cumExecQty` and `leavesQty`. A `New` or `PartiallyFilled` order can have remaining quantity to cancel:

```sh
node --env-file=.env first-order.ts cancel
node --env-file=.env first-order.ts status
```

Submission and cancellation responses acknowledge requests, not the final order state. Query `status` again if the result has not yet updated. `cumExecQty` includes earlier fills even when the final status is `Cancelled`; resulting positions are separate from the remaining order quantity.

See Bybit's [create-order](https://bybit-exchange.github.io/docs/v5/order/create-order) and [cancel-order](https://bybit-exchange.github.io/docs/v5/order/cancel-order) contracts. You can also run the [private order stream](/guides/private-streams) in another terminal.

## Recover an interrupted request

A timeout or lost response can happen after Bybit accepts a request. The example does not retry submissions or cancellations automatically.

If you received an `orderId`, query `status` with that ID and the same account. If submission timed out before returning an ID, inspect realtime orders and order history for BTCUSDT, and reconcile executions and positions using the request time, side, price and quantity. Avoid resubmitting until the outcome is resolved.

An empty result is inconclusive: recent closed orders can disappear from the realtime endpoint after a service restart, and history can lag. See [open and closed orders](https://bybit-exchange.github.io/docs/v5/order/open-order).

Stopping the process or closing a WebSocket does not cancel an open order.

[Authentication](/guides/authentication) · [Private order stream](/guides/private-streams) · [Error handling](/guides/errors)
