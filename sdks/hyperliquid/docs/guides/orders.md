---
title: Place and cancel a Hyperliquid Testnet order
description: Submit a post-only BTC perpetual order, query it by client order ID and cancel its remaining quantity.
---

# Place and cancel a Testnet order

Place a BTC perpetual limit order with `RestClient`, query its status, then cancel any remaining quantity. Each operation runs as a separate command against Testnet.

A post-only order is rejected if it would immediately take liquidity. Once resting, it can fill before cancellation. Cancelling an order does not reverse fills or close an existing position.

## Set up

Use Node.js 24, a funded Hyperliquid Testnet account and an API wallet authorized for that account. See [API wallets and account addresses](/guides/authentication#api-wallets-and-vaults).

Install the SDK:

```sh
npm install @siebly/hyperliquid-api
```

Create a private `.env` file and add it to `.gitignore`:

```dotenv
HYPERLIQUID_ACCOUNT_ADDRESS=0x1111111111111111111111111111111111111111 # Example managed account
HYPERLIQUID_PRIVATE_KEY=0x2222222222222222222222222222222222222222222222222222222222222222 # Public example key; use your API wallet key
HYPERLIQUID_ORDER_SIZE=0.001 # BTC; illustrative size
HYPERLIQUID_LIMIT_PRICE=60000 # USD; adjust for the current market
HYPERLIQUID_CLIENT_ORDER_ID=0x0123456789abcdef0123456789abcdef # Unique per new order
```

The address and key above are illustrative. Use the authorized API wallet's key and the account it manages. Signing runs locally in Node.js.

Set a size in BTC and a buy price below the current Testnet BTC best bid. The example passes both values as decimal strings; the exchange applies its current [tick and lot size rules](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size).

Generate a client order ID once, then paste it into `.env`:

```sh
node -e "console.log('0x' + require('node:crypto').randomBytes(16).toString('hex'))"
```

Use the same ID and account address for all three commands. Each new order needs a new ID.

## Save the example

Save the following as `orders.mts`. Node.js 24 runs this TypeScript file directly.

<<< @/../examples/first-order.ts

## Place the order

```sh
node --env-file=.env orders.mts place
```

The script prints the client order ID and submits one order.

`postOnly: true` selects the exchange's ALO order type. A successful response contains an individual result: `resting`, `filled` or `error`. The script checks that result rather than treating a fulfilled request as proof of acceptance.

## Query and cancel

Read the same order:

```sh
node --env-file=.env orders.mts status
```

The status command calls [`getOrderStatus()`](/api/classes/RestClient#getorderstatus) with the client order ID from `.env`. It requires the account address, but no signing key.

Cancel remaining open quantity:

```sh
node --env-file=.env orders.mts cancel
node --env-file=.env orders.mts status
```

Cancellation queries the order first and skips orders that are no longer open. Query again to confirm the final state. Cancellation can race with execution, so the final status may be `filled`.

## Recover an interrupted request

A timeout can occur after the exchange accepts a request. Query `status` with the same client order ID before deciding whether to resubmit. The example does not retry writes.

`unknownOid` means no order was found for that account and ID. Check order and fill history to resolve an uncertain submission. Closing the script or a WebSocket does not cancel an open order.

[Account order updates](/guides/private-streams) · [Order results](/guides/errors#order-results) · [Production usage](/guides/production)
