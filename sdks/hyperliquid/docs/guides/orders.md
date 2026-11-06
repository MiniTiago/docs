---
title: Place and cancel a Hyperliquid Testnet order
description: Submit a post-only BTC perpetual order, query it by client order ID and cancel its remaining quantity.
---

# Place and cancel a Testnet order

Place a BTC perpetual limit order with `RestClient`, query its status, then cancel any remaining quantity. Each operation runs as a separate command against Testnet.

A post-only order is rejected if it would immediately take liquidity. Once resting, it can fill before cancellation. Cancelling an order does not reverse fills or close an existing position.

## Set up

Use Node.js 24, a funded Hyperliquid Testnet account and an API wallet authorized for that account. See [API wallets and account addresses](/guides/authentication#api-wallets-and-vaults).

Install the SDK and the wallet utility used to check the signer address:

```sh
npm install @siebly/hyperliquid-api ethers
```

Create a private `.env` file and add it to `.gitignore`:

```dotenv
HYPERLIQUID_ACCOUNT_ADDRESS=replace_with_your_managed_account_address
HYPERLIQUID_PRIVATE_KEY=replace_with_your_testnet_api_wallet_key
HYPERLIQUID_ALLOW_TESTNET_ORDER=YES
HYPERLIQUID_ORDER_SIZE=replace_with_your_btc_size
HYPERLIQUID_LIMIT_PRICE=replace_with_your_limit_price
HYPERLIQUID_MAX_NOTIONAL=replace_with_your_usd_notional_cap
```

Use the API wallet's private key, not the main account key. The example checks that the signer is an API wallet for `HYPERLIQUID_ACCOUNT_ADDRESS` before placing or cancelling an order. Keep signing code and keys on your server or development machine, never in a browser bundle.

Choose a buy price below the current Testnet BTC best bid and a size in BTC. Set a cap on `price × size`; it is an order-notional limit, not a limit on position losses. There are no default price or size values.

## Save the example

Save the following as `orders.mts`. Node.js 24 runs this TypeScript file directly.

<<< @/../examples/first-order.ts

The example reads `szDecimals` from [`getPerpMetadata()`](/api/classes/RestClient#getperpmetadata). Size must fit that decimal limit. Noninteger perpetual prices allow at most five significant figures and `6 - szDecimals` decimal places. Integer prices are exempt from the significant-figure limit. See [tick and lot sizes](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size).

Inputs remain decimal strings. The validation uses integer arithmetic and rejects invalid values rather than rounding the order. Hyperliquid still checks margin, minimum trade value and other exchange rules when it receives the request.

## Place the order

```sh
node --env-file=.env orders.mts place
```

Before submission, the script saves the account, network, price, size and a unique `cloid` in `hyperliquid-testnet-order.json`. Add this file to `.gitignore`. An existing receipt prevents another submission.

`postOnly: true` selects the exchange's ALO order type. A successful response contains an individual result: `resting`, `filled` or `error`. The script checks that result rather than treating a fulfilled request as proof of acceptance.

## Query and cancel

Read the saved order:

```sh
node --env-file=.env orders.mts status
```

The status command calls [`getOrderStatus()`](/api/classes/RestClient#getorderstatus) with the saved client order ID. It requires the account address, but no signing key.

Cancel remaining open quantity:

```sh
node --env-file=.env orders.mts cancel
node --env-file=.env orders.mts status
```

Cancellation queries the order first and skips orders that are no longer open. A successful cancellation response means the exchange accepted the cancellation; query again to confirm the final state. If a fill wins the race, the status may be `filled`. Review fills and positions even when the remaining order is cancelled.

## Recover an interrupted request

Keep the receipt after an error or timeout. A lost response does not establish whether Hyperliquid accepted the order or cancellation. Run `status` with the same receipt before taking another action; the example never retries a write automatically.

`unknownOid` means the query found no order. Confirm the Testnet account and identifier, then check order and fill history before placing another order. Do not delete the receipt just to bypass the submission guard.

After the order is terminal and you have handled any Testnet position, archive the receipt before starting another deliberate order. Stopping a process or closing a WebSocket does not cancel an open order.

[Account order updates](/guides/private-streams) · [Order results](/guides/errors#order-results) · [Production usage](/guides/production)
