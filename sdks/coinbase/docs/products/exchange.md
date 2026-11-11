---
title: "Coinbase Exchange SDK"
description: "Read Exchange prices, stream public and private updates, and manage Exchange accounts and orders."
---

# Exchange

`CBExchangeClient` targets Coinbase Exchange at `api.exchange.coinbase.com`. Use Exchange credentials, accounts and product IDs throughout this guide.

## Setup {#setup}

Install the package with `npm install coinbase-api`. Save each example with the shown filename and run it with Node.js 24. Public examples need no credentials; for authenticated examples, add the named variables to a private `.env` file excluded from Git, then use `node --env-file=.env filename.ts`. Keep account output private.

## Public REST {#market-data}

Save as `exchange-market-data.ts` and run `node exchange-market-data.ts`:

<<< @/../examples/exchange-market-data.ts

Use `getAllTradingPairs()` to discover products, `getProduct()` for size/price increments and trading restrictions, and `getProductBook()` for a book snapshot. Keep price and size strings at the exchange's supported precision.

## Public WebSocket prices {#public-streams}

Save as `exchange-stream.ts` and run `node exchange-stream.ts`:

<<< @/../examples/exchange-stream.ts

The stream runs until Ctrl+C. `ticker` updates arrive on `update`; inspect `response` for subscription confirmation and `exception` for errors. To maintain a book, use the Exchange `level2` channel and apply its snapshot/update rules. The singular `heartbeat` channel is available for connection activity.

## Authentication and account reads {#authentication}

Create an Exchange API key with the permissions needed by your application. Set:

```dotenv
COINBASE_EXCHANGE_API_KEY=your-exchange-key
COINBASE_EXCHANGE_API_SECRET=your-exchange-secret
COINBASE_EXCHANGE_API_PASSPHRASE=your-api-passphrase
```

The passphrase belongs to the API key, not your account password. Save as `exchange-account.ts`:

<<< @/../examples/exchange-account.ts

### Balances and current orders {#account-state}

`getAccounts()` supplies balances and holds. `getOrders()` defaults to open or unsettled orders; a settled order disappearing from this list does not mean it never existed. Use `getOrder({ order_id })` or `getFills()` for the specific history you need. Follow the endpoint's pagination rather than assuming one response is complete.

## Order management {#orders}

1. Read product rules and available balances, then build the Exchange request: `product_id`, `side`, `type`, and the applicable `price`, `size` or `funds` fields. These are flat fields, not an order-configuration object.
2. Generate and persist a client identifier with `client.generateNewOrderId()`, pass it as `client_oid`, and call `submitOrder()` only when ready to trade. This is a live operation.
3. Save the returned exchange order ID and follow private events. Use `getOrder({ order_id })` for a specific unresolved outcome, not as a routine follow-up to every submission.
4. Call `cancelOrder({ order_id })` to cancel an individual order. Cancellation can race with fills; reconcile the final state before submitting a replacement.

A timeout does not prove a submission failed. Match the original client/exchange identifiers against events and targeted reads before retrying.

## Private order updates {#private-streams}

Save as `exchange-private-stream.ts` and run with the Exchange environment variables:

<<< @/../examples/exchange-private-stream.ts

This subscribes to the authenticated Exchange `user` channel through `exchangeDirectMarketData`. The SDK signs the subscription using the Exchange key, secret and passphrase. `exchangeMarketData` is the public route; supplying credentials alone does not turn that route into this authenticated subscription.

Load starting orders and account state, then apply user order events passively. For balance updates, the authenticated `balance` channel takes `payload.account_ids` containing Exchange account IDs. Do not assume the `user` channel itself is a full balance ledger.

Mark state stale on `reconnect`. On `reconnected`, confirm subscription recovery and reconcile missing orders/fills/balances through targeted REST reads, accounting for events received during recovery. Resume dependent actions only when state is current. See [Account State](https://siebly.io/reference/glossary#accountstate).

## Environments and reference {#environments}

`useSandbox: true` selects Exchange sandbox REST and WebSocket hosts. Use sandbox credentials for private requests. Keep separate client instances for live and sandbox accounts.

This SDK's `WebsocketAPIClient` does not provide Exchange order entry. Use REST for order commands and subscriptions for updates.

[Exchange client reference](/api/classes/CBExchangeClient) · [Exchange WebSocket channels](https://docs.cdp.coinbase.com/exchange/docs/websocket-channels) · [Choose another API](/products)
