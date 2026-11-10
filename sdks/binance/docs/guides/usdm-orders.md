---
title: Place and manage a Binance USD-M futures order
description: Initialize futures account state, observe private WebSocket events, and place or cancel orders with USDMClient.
---

# Place and manage a USD-M futures order

Use `USDMClient` for Binance's USD-M futures markets. This walkthrough reads starting account state, follows private WebSocket updates, and uses REST to place and cancel a BTCUSDT perpetual order.

The separate CLI commands make each step explicit. A persistent application can call the same SDK methods within one workflow, keeping the user data stream connected and tracking account and order state locally. Use scoped REST reads to initialize state or recover gaps and uncertain outcomes, not after every order.

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

## Follow account changes

Save the following as `usdm-private-stream.ts` and run it in another terminal with the same Demo Trading credentials:

<<< @/../examples/usdm-private-stream.ts

```sh
node --env-file=.env usdm-private-stream.ts
```

Wait for the user data connection to open before placing an order. `ORDER_TRADE_UPDATE` reports order changes and fills; `ACCOUNT_UPDATE` reports balance and position changes. Apply these events to local state instead of repeatedly reading the account through REST. The demonstration prints events for 60 seconds and does not maintain a complete state store.

In a persistent application, subscribe before loading the initial account data, account for events received during that read, and recover missed state after a connection gap. See [account state](/guides/production#keep-account-state-up-to-date).

The position changes in `ACCOUNT_UPDATE` can trigger follow-up logic, such as placing or resizing SL/TP orders when a position opens or increases. Merge the reported positions into local state rather than treating each event as a full account snapshot. Compare position size by symbol and position side, then use a [throttled debounce with a maximum wait](/guides/production#trigger-follow-up-work-from-position-changes) so partial fills do not cause a burst of API calls or delay adjustments indefinitely.

The stream emits `reconnecting` when connection recovery starts and `reconnected` when the socket reopens. Use the latter to trigger REST reconciliation of missed account and order state before making dependent order adjustments; see [stream recovery](/guides/production#recover-streaming-state).

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

## Cancel remaining quantity {#query-and-cancel}

Follow matching `ORDER_TRADE_UPDATE` events for the saved order ID. If the order still has open quantity, request cancellation:

```sh
node --env-file=.env usdm-order.ts cancel
```

The cancellation response can include executed quantity from partial fills. Continue following user data events for the resulting order and position state. Cancelling an order does not undo fills or close a position.

## Position mode and fills

In one-way mode, a buy can increase a long position or reduce an existing short. It can cross through zero into a long if its filled quantity exceeds the short. This example is not a reduce-only closing order.

Hedge mode uses `positionSide: 'LONG'` or `'SHORT'` explicitly. Choose both `side` and `positionSide` for the intended position effect rather than copying the one-way parameters. For a one-way closing order, the API supports `reduceOnly: 'true'`; it cannot be sent in Hedge Mode. See the [futures order parameters](https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/New-Order).

## Recover an uncertain outcome

The example logs the actual error and does not retry automatically. A timeout or ambiguous server error does not prove that an order failed.

Check matching user data events first. If the outcome remains unclear, use `getOrder()` through the one-shot status command:

```sh
node --env-file=.env usdm-order.ts status
```

Use this for diagnosis or recovery, not after every order. If no ID is available, reconcile [`getAllOpenOrders()`](/api/classes/USDMClient#getallopenorders), [`getAllOrders()`](/api/classes/USDMClient#getallorders), [`getAccountTrades()`](/api/classes/USDMClient#getaccounttrades) and [`getPositionsV3()`](/api/classes/USDMClient#getpositionsv3) using the symbol, request time, side, price and quantity. Resolve the outcome before sending another order. An order missing from the open list may already have filled or been cancelled.

[USD-M reference](/api/classes/USDMClient) · [Error handling](/guides/errors) · [Production usage](/guides/production)
