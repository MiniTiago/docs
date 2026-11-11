---
title: "Coinbase International Exchange SDK"
description: "Read INTX instruments, subscribe to authenticated market data, and manage portfolio balances, positions and orders."
---

# International Exchange

`CBInternationalClient` targets INTX at `api.international.coinbase.com`. Keep INTX instruments, portfolio IDs and credentials together; its order schema is specific to this product.

## Setup {#setup}

Install the package with `npm install coinbase-api`. Save each example with the shown filename and run it with Node.js 24. Public examples need no credentials; for authenticated examples, add the named variables to a private `.env` file excluded from Git, then use `node --env-file=.env filename.ts`. Keep account output private.

## Public REST instruments {#market-data}

Save as `international-market-data.ts` and run `node international-market-data.ts`:

<<< @/../examples/international-market-data.ts

Select the instrument returned by `getInstruments()`. `getInstrumentDetails({ instrument })` reads its rules; `getQuotePerInstrument({ instrument })` reads a quote. Do not infer the instrument name or size constraints from another exchange's symbol.

## Authentication {#authentication}

INTX market WebSockets require an API key, secret and API passphrase, even though the public REST discovery request does not. Set these in `.env`:

```dotenv
COINBASE_INTX_API_KEY=your-intx-key
COINBASE_INTX_API_SECRET=your-intx-secret
COINBASE_INTX_API_PASSPHRASE=your-api-passphrase
```

## Market WebSocket subscriptions {#public-streams}

Save as `international-stream.ts`:

<<< @/../examples/international-stream.ts

The `LEVEL1` subscription provides market updates for `BTC-PERP`; choose an instrument available to your environment. Channel names are case-sensitive. The SDK signs requests for `internationalMarketData`. Inspect `response` and `exception` before relying on the stream, which runs until Ctrl+C.

This is market data, not a stream of your portfolio positions or orders.

## Read balances and positions {#account-state}

Use `getUserPortfolios()` to find your INTX portfolio ID. Add `COINBASE_INTX_PORTFOLIO` to `.env`, then save this as `international-account.ts`:

<<< @/../examples/international-account.ts

Keep balances, positions and orders scoped to the same portfolio. `getPortfolioSummary()` provides a broader summary; `getPositionForPortfolioInstrument()` narrows a position read to one instrument. Respect each list endpoint's pagination.

## Order management {#orders}

Build an INTX `submitOrder()` request with `instrument`, `portfolio`, `side`, `size`, `type` and `tif`, plus a price where required. Generate and persist `client_order_id` with `client.generateNewOrderId()` before sending. Submission changes the live account.

Use `getOrderDetails({ id, portfolio })` for a specific order, `getOpenOrders({ portfolio })` for current open orders, and `getPortfolioFills()` for execution history. `updateOpenOrder()` amends an order; `cancelOrder({ id, portfolio })` cancels it. Preserve the portfolio alongside the returned order ID.

Do not treat the market WebSocket as confirmation of your fills. Resolve unknown submissions or cancellations with the relevant portfolio order/fill reads. If your application has a separate private event source, apply it passively and use REST for startup or missing state; this SDK does not map a separate INTX private-account feed or INTX WebSocket order API.

## Environments and recovery {#environments}

`useSandbox: true` selects INTX sandbox REST and WebSocket hosts. Use corresponding credentials and instruments.

The market client reconnects and restores subscriptions. On `reconnect`, mark derived market state stale; on `reconnected`, confirm the channel and rebuild any missing snapshot state before making dependent decisions. A recovered market socket does not repair portfolio state automatically.

[INTX client reference](/api/classes/CBInternationalClient) · [INTX WebSocket documentation](https://docs.cdp.coinbase.com/intx/docs/websocket-overview) · [Choose another API](/products)
