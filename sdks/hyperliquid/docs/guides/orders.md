---
title: Place and cancel a Hyperliquid Testnet order
description: Submit a post-only BTC perpetual order, query it by order ID and cancel its remaining quantity.
---

# Place and cancel a Testnet order

Place a BTC perpetual limit order with `RestClient`, query its status, then cancel any remaining quantity. Each operation runs as a separate command.

This walkthrough uses Hyperliquid Testnet and test funds to avoid accidental live trades. The same methods work on Mainnet, Hyperliquid's production markets. Remove `testnet` or set it to `false`, and use the Mainnet account address with an authorized signer to execute against live markets.

A post-only order is rejected if it would immediately take liquidity. Once resting, it can fill before cancellation. Cancelling an order does not reverse fills or close an existing position.

## Set up

To run this example on Testnet, use Node.js 24, a funded Hyperliquid Testnet account and an API wallet authorized for that account. See [API wallets and account addresses](/guides/authentication#api-wallets-and-vaults).

Install the [`@siebly/hyperliquid-api`](https://www.npmjs.com/package/@siebly/hyperliquid-api) npm package:

```sh
npm install @siebly/hyperliquid-api
```

Create a private `.env` file and add it to `.gitignore`:

```dotenv
HYPERLIQUID_ACCOUNT_ADDRESS=0x1111111111111111111111111111111111111111 # Example managed account
HYPERLIQUID_PRIVATE_KEY=0x2222222222222222222222222222222222222222222222222222222222222222 # Public example key; use your API wallet key
HYPERLIQUID_ORDER_SIZE=0.001 # BTC; illustrative size
HYPERLIQUID_LIMIT_PRICE=60000 # USD; adjust for the current market
```

The address and key above are illustrative. Use the authorized API wallet's key and the account it manages. Signing runs locally in Node.js.

Set a size in BTC and a buy price below the current Testnet BTC best bid. The example passes both values as decimal strings; the exchange applies its current [tick and lot size rules](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size).

## Save the example

Save the following as `orders.mts`. Node.js 24 runs this TypeScript file directly.

<<< @/../examples/first-order.ts

## Place the order

```sh
node --env-file=.env orders.mts place
```

The script submits one order and prints its exchange-assigned numeric ID. Save the printed `HYPERLIQUID_ORDER_ID` line in `.env` for the following commands, for example:

```dotenv
HYPERLIQUID_ORDER_ID=123456789 # Use the ID returned by your order
```

`postOnly: true` selects the exchange's ALO order type. A successful response contains an individual result: `resting`, `filled` or `error`. The script checks that result rather than treating a fulfilled request as proof of acceptance.

## Query and cancel

Read the same order:

```sh
node --env-file=.env orders.mts status
```

The status command calls [`getOrderStatus()`](/api/classes/RestClient#getorderstatus) with the order ID from `.env`. It requires the account address, but no signing key.

Cancel remaining open quantity:

```sh
node --env-file=.env orders.mts cancel
node --env-file=.env orders.mts status
```

Cancellation queries the order first and skips orders that are no longer open. Query again to confirm the final state. Cancellation can race with execution, so the final status may be `filled`.

## Recover an interrupted request

A timeout can occur after the exchange accepts a request. If you received the order ID, query `status`. If the submission response was lost before an ID was returned, inspect the account's open orders, order history and fills to identify the outcome before resubmitting. The example does not retry writes.

`unknownOid` means no order was found for that account and ID. Check order and fill history to resolve an uncertain submission. Closing the script or a WebSocket does not cancel an open order.

[Account order updates](/guides/private-streams) · [Order results](/guides/errors#order-results) · [Production usage](/guides/production)
