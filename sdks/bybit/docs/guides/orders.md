---
title: "Bybit order management"
description: "Submit and cancel a PostOnly limit order through REST, and follow order changes through a private WebSocket stream."
---

# Order management {#place-and-cancel-a-testnet-order}

Use `RestClientV5` to place one BTCUSDT perpetual limit order and cancel any unfilled quantity. Run the private order stream alongside these REST commands to follow its status.

The separate CLI commands make each step explicit. A persistent application can call the same SDK methods within one workflow, keeping the private stream connected and tracking orders in local state. Use scoped REST reads to initialize state or recover gaps and uncertain outcomes, not after every order.

This walkthrough uses Bybit Testnet and test funds to avoid accidental live trades. The same methods work on Mainnet, Bybit's production markets. Remove `testnet` or set it to `false`, leave `demoTrading` disabled and use Mainnet credentials to execute against live markets. To test your system with simulated orders instead, set `demoTrading: true`, keep `testnet: false` and use Bybit Demo Trading credentials.

Before placing orders, use the [authenticated account read](/guides/authentication) to check balances and account access.

## Before you start

- Use Node.js 24 and install the [`bybit-api`](https://www.npmjs.com/package/bybit-api) npm package with `npm install bybit-api`.
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

## Place and observe the order {#place-query-and-cancel}

Save this as `first-order.ts`:

<<< @/../examples/first-order.ts

Start the [private order stream](/guides/private-streams) in another terminal using the same Testnet account. Wait for `Private stream authenticated.` and `Subscribed to order.linear.` before continuing. Keep the stream running while you try the commands; the demonstration stops after 60 seconds.

Place the order:

```sh
node --env-file=.env first-order.ts place
```

The response supplies `orderId`. Copy the ID printed by the script into `.env` before running `status` or `cancel`:

```dotenv
BYBIT_ORDER_ID=a1b2c3d4-5678-4abc-9def-0123456789ab # Use the returned orderId.
```

Follow the stream's matching `orderId` updates. Inspect `orderStatus`, `cumExecQty` and `leavesQty` as they change.

## Cancel remaining quantity

A `New` or `PartiallyFilled` order can have remaining quantity to cancel:

```sh
node --env-file=.env first-order.ts cancel
```

Submission and cancellation responses acknowledge requests. Follow the private stream to see the resulting order state; cancellation can race with a fill. `cumExecQty` includes earlier fills even when the final status is `Cancelled`; resulting positions are separate from the remaining order quantity.

See Bybit's [create-order](https://bybit-exchange.github.io/docs/v5/order/create-order) and [cancel-order](https://bybit-exchange.github.io/docs/v5/order/cancel-order) contracts. Use the execution and position topics as well when your application needs fills and position changes, rather than repeatedly querying them through REST.

## Recover an interrupted request

A timeout or lost response can happen after Bybit accepts a request. The example does not retry submissions or cancellations automatically.

Check matching private events first. If the outcome is still unclear, make one [`getActiveOrders()`](/api/classes/RestClientV5#getactiveorders) request with the saved `orderId` and the same account. The example exposes this recovery step through `status`:

```sh
node --env-file=.env first-order.ts status
```

Use this for diagnosis or recovery, not after every order. Despite its name, the method also returns recent closed orders. If no ID is available, use realtime orders, order history, executions and positions for BTCUSDT to resolve the request using its time, side, price and quantity. Avoid resubmitting until the outcome is resolved.

For older records, or closed orders no longer available after a service restart, use [`getHistoricOrders()`](/api/classes/RestClientV5#gethistoricorders). Set `orderStatus: 'Cancelled'` when looking for a cancelled order; from 3 December 2026, unfiltered recent history excludes `Cancelled`, `Rejected` and `Deactivated`.

An empty result is inconclusive, and history can lag behind order updates. See [open and closed orders](https://bybit-exchange.github.io/docs/v5/order/open-order).

Stopping the process or closing a WebSocket does not cancel an open order.

[Authentication](/guides/authentication) · [Private order stream](/guides/private-streams) · [Error handling](/guides/errors)
