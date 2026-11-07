---
title: "Place and cancel a Bybit Testnet order"
description: "Submit a PostOnly limit order, query its status and cancel its remaining quantity."
---

# Place and cancel a Testnet order

Use `RestClientV5` to place one BTCUSDT perpetual limit order, query it by your client order ID and cancel any unfilled quantity. Each command runs separately. The client is configured for Bybit Testnet.

## Before you start

- Use Node.js 24 and install the SDK with `npm install bybit-api`.
- Create Testnet API credentials with derivatives trading and account-read permissions. Fund the Testnet account with test assets.
- Use a Unified Trading Account with BTCUSDT in one-way position mode (`positionIdx: 0`). The example does not change your account's position mode or leverage.
- Store credentials in a server-side `.env` file excluded from version control. Leave `BYBITTRACE` unset to avoid logging signed requests.

A PostOnly order is cancelled if it would immediately take liquidity. A resting order can fill before cancellation. Cancelling the remaining quantity does not close a position created by a fill.

## Configure the order

Create a `.env` file:

```dotenv
# Use your own Bybit Testnet credentials.
BYBIT_API_KEY=example_testnet_key
BYBIT_API_SECRET=example_testnet_secret
BYBIT_ORDER_ID=docs-example-001 # Unique for each new order.
BYBIT_LIMIT_PRICE=60000 # Illustrative USDT price; choose for the current market.
BYBIT_ORDER_QTY=0.001 # Illustrative BTC quantity; current symbol filters apply.
```

Set the buy price below the current Testnet BTCUSDT best bid and specify quantity in BTC. Use decimal strings that satisfy the current price increments, quantity increments and minimum order value from [`getInstrumentsInfo()`](/api/classes/RestClientV5#getinstrumentsinfo). This example sends your values unchanged; Bybit validates them, account margin and dynamic price limits. Prices can move before submission.

`BYBIT_ORDER_ID` is a unique client order ID of at most 36 characters, using letters, numbers, hyphens or underscores. Store it in `.env` and reuse it for status and cancellation. A new order needs a new ID.

## Place, query and cancel

Save this as `first-order.ts`:

<<< @/../examples/first-order.ts

Place the order:

```sh
node --env-file=.env first-order.ts place
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

After an uncertain response, query `status` with the same `BYBIT_ORDER_ID` and account rather than resubmitting. An empty result is inconclusive: recent closed orders can disappear from the realtime endpoint after a service restart, and history can lag. Use Testnet order history and positions to reconcile the outcome; see [open and closed orders](https://bybit-exchange.github.io/docs/v5/order/open-order).

Stopping the process or closing a WebSocket does not cancel an open order.

[Authentication](/guides/authentication) · [Private order stream](/guides/private-streams) · [Error handling](/guides/errors)
