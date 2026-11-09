---
title: Place and manage a Binance USD-M futures order
description: Read futures account state, place a post-only order, query its status and cancel remaining quantity with USDMClient.
---

# Place and manage a USD-M futures order

Use `USDMClient` for Binance's USD-M futures markets. This walkthrough reads account state, then places, queries and cancels a BTCUSDT perpetual order. Each operation runs separately.

The examples use Futures Demo Trading and virtual funds to avoid accidental live trades. The same methods work on Mainnet, Binance's production markets. Remove `demoTrading` or set it to `false`, leave `testnet` disabled and use production credentials to execute against live markets.

## Set up

Use Node.js 24 and install the [`binance`](https://www.npmjs.com/package/binance) npm package in a server-side project:

```sh
npm install binance
```

Create credentials in **API Management** within [Binance Futures Demo Trading](https://www.binance.com/en/support/faq/detail/ab78f9a1b8824cf0a106b4229c76496d). Use that account's virtual futures balance and permissions to read account state and trade. These are not Spot Testnet or production credentials.

The examples select the environment with `demoTrading: true`. Leave `testnet` false or omitted; the flags are alternatives, not a combination.

Create a private `.env` file and exclude it from version control. Keep API credentials in a secure server-side environment:

```dotenv
BINANCE_API_KEY=demo_key_a1b2c3d4e5f6 # Illustrative; use your Demo Trading key
BINANCE_API_SECRET=demo_secret_7f8e9d0c1b2a # Illustrative; use its secret
BINANCE_USDM_PRICE=60000 # USDT per BTC; choose for the current market
BINANCE_USDM_QUANTITY=0.002 # BTC; adjust for your available margin
```

Choose a buy price below the current best ask. Use [`getExchangeInfo()`](/api/classes/USDMClient#getexchangeinfo) to inspect the symbol's current price increment, quantity increment and minimum notional. The SDK accepts numeric price and quantity values for this method; the exchange validates the order.

## Read account state

Save this as `usdm-account.ts`:

<<< @/../examples/usdm-account.ts

```sh
node --env-file=.env usdm-account.ts
```

This prints the account's trading permission and margin balances, balance records, BTCUSDT positions and position mode. It uses the current V3 account methods and makes no account changes. No open BTCUSDT position may mean an empty positions list.

## Place a post-only order

The order example assumes **one-way mode**, using `positionSide: 'BOTH'`. Check the account output before using it. The program does not change position mode, margin mode or leverage.

Save this as `usdm-order.ts`:

<<< @/../examples/usdm-order.ts

```sh
node --env-file=.env usdm-order.ts place
```

For futures, `type: 'LIMIT'` with `timeInForce: 'GTX'` is post-only. It will not take liquidity immediately; an accepted resting order can still fill before you cancel it. The response acknowledges submission, not a fill.

Save the returned exchange order ID in `.env`:

```dotenv
BINANCE_USDM_ORDER_ID=123456789 # Use the orderId printed by your submission
```

## Query and cancel

Query that order:

```sh
node --env-file=.env usdm-order.ts status
```

The output shows the order status, executed quantity and original quantity. To cancel any remaining open quantity:

```sh
node --env-file=.env usdm-order.ts cancel
```

The cancellation response includes the executed quantity so partial fills remain visible. Run `status` again to inspect the order. Cancelling an order does not undo fills or close a position.

## Position mode and fills

In one-way mode, a buy can increase a long position or reduce an existing short. It can cross through zero into a long if its filled quantity exceeds the short. This example is not a reduce-only closing order.

Hedge mode uses `positionSide: 'LONG'` or `'SHORT'` explicitly. Choose both `side` and `positionSide` for the intended position effect rather than copying the one-way parameters. For a one-way closing order, the API supports `reduceOnly: 'true'`; it cannot be sent in Hedge Mode. See the [futures order parameters](https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/New-Order).

## Recover an uncertain outcome

The example logs the actual error and does not retry automatically. A timeout or ambiguous server error does not prove that an order failed.

If you received an order ID, query it with `getOrder()`. If submission returned no ID, reconcile [`getAllOpenOrders()`](/api/classes/USDMClient#getallopenorders), [`getAllOrders()`](/api/classes/USDMClient#getallorders), [`getAccountTrades()`](/api/classes/USDMClient#getaccounttrades) and [`getPositionsV3()`](/api/classes/USDMClient#getpositionsv3) using the symbol, request time, side, price and quantity. Resolve the outcome before sending another order. An order missing from the open list may already have filled or been cancelled.

[USD-M reference](/api/classes/USDMClient) · [Error handling](/guides/errors) · [Production usage](/guides/production)
