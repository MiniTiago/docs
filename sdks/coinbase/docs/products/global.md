---
title: "Coinbase Global derivatives SDK"
description: "Use Global derivatives HTTP JSON-RPC, WebSocket API methods and subscriptions."
---

# Global derivatives

Use this section for the Coinbase Global derivatives gateway, not Advanced Trade spot trading. Access requires product eligibility and the appropriate account permissions.

## Setup {#setup}

Install the package with `npm install coinbase-api`. Save each example with the filename shown below and run it with Node.js 24. For private examples, put the named credentials in a private `.env` file excluded from Git and use `node --env-file=.env filename.ts`. Keep account output private.

## Public REST {#market-data}

`CBAdvancedTradeGlobalClient` targets `https://drb.coinbase.com`. Its methods send JSON-RPC requests over HTTP and return the unwrapped `result`. Public instrument discovery needs no key. Save as `global-market-data.ts` and run `node global-market-data.ts`:

<<< @/../examples/global-market-data.ts

Use the returned instrument names for Global requests. Do not replace them with Advanced Trade spot product IDs such as `BTC-USD`. Global prices and sizes are JSON numbers, order enums are lowercase, and `label` is not a unique equivalent of `client_order_id`. Use the Global types rather than translating an Advanced Trade order mechanically.

## Public WebSocket subscriptions {#public-streams}

Use `WS_KEY_MAP.advTradeGlobalMarketData` for public streams at `streams.drb.coinbase.com`. Global channel parameters belong in the topic string, not an Advanced Trade `product_ids` payload. Select an instrument returned by the discovery request above; public intervals include `100ms` and `agg2`, while `raw` requires authentication.

Save as `global-stream.ts` and run `node global-stream.ts`:

<<< @/../examples/global-stream.ts

The example runs until Ctrl+C. Verify the subscription response and implement the channel's snapshot/update rules before building local state. `connectAll()` does not open Global feeds; subscriptions connect on demand.

## Private REST and order management {#orders}

For private HTTP calls, provide the eligible CDP key name and private key. The SDK exchanges a fresh signed JWT through `public/auth`, caches the returned Bearer token and refreshes it when needed. Token rejection invalidates cached authorization; the failed operation is **not automatically replayed**. Reconcile uncertain writes before retrying.

Read account state with `getAccountSummary()` and `getPositions()` for the required currency. Use `getOpenOrders()` to initialize open-order state. These methods use Global parameters and return types, not the Advanced Trade account schema.

Set `COINBASE_GLOBAL_API_KEY` to your CDP key name and `COINBASE_GLOBAL_API_SECRET` to its complete private key. Preserve the original key header, footer and line breaks; the REST client normalizes escaped `\n` sequences, and the private-stream example normalizes them explicitly. Save as `global-account.ts` and run with your `.env` file:

<<< @/../examples/global-account.ts

For live trading, `submitBuy()` and `submitSell()` submit Global orders, `getOrderState()` resolves a specific unknown order, and `cancelOrder()` requests cancellation. These are live actions, not preview operations. Save exchange order IDs, inspect results and use private updates to track execution. A non-unique label alone is not sufficient duplicate protection.

## Private WebSocket subscriptions {#private-streams}

Use `WS_KEY_MAP.advTradeGlobalUserData` on `drb.coinbase.com`. The SDK authenticates through `public/auth` before `private/subscribe`, renews the session and restores subscriptions after authenticating a replacement connection.

Save as `global-private-stream.ts` and run with the same Global environment variables:

<<< @/../examples/global-private-stream.ts

This example observes USDC futures order, trade and portfolio changes without placing an order. Adapt currency and product kind to your account. Apply updates passively to account state; use REST for starting state and specific gaps rather than polling. Mark state stale on `reconnect`; `reconnected` alone does not prove authentication, subscription or state recovery has completed. See [Account State](https://siebly.io/reference/glossary#accountstate).

## Global WebSocket API {#ws-api}

`WebsocketAPIClient` provides awaitable Global JSON-RPC methods. This public, one-shot example reads server time and closes its connection. Save as `global-ws-api.ts` and run `node global-ws-api.ts`:

<<< @/../examples/global-ws-api.ts

`advTradeGlobalWSAPI` is a dedicated request-response connection, separate from private subscriptions even though both use `drb.coinbase.com`. Read `response.result`; unlike the Global HTTP client, this API returns the envelope. `getWSClient()` exposes the underlying event and connection client. `connectWSAPI()` optionally warms up an authenticated session; public calls do not require this authentication step.

Private calls authenticate the socket automatically. The SDK manages session renewal and can reauthenticate after reconnect. `wsAPITimeout` controls the reply wait after sending (default 10 seconds); connection/authentication use their own lifecycle handling. Pending requests are rejected if their connection is lost. `reauthWSAPIOnReconnect` defaults to enabled for a previously authenticated API session. A new session does not establish the outcome of a command sent on the old one.

## Errors and uncertain outcomes {#errors}

JSON-RPC protocol errors reject even when carried by HTTP 200. Inspect their code and message, not only HTTP status. HTTP error parsing is controlled by `parseExceptions`; Global credential redaction and rejected-token invalidation still apply when parsing is disabled.

WebSocket API calls reject on protocol errors, reply timeout or connection failure. A timed-out trading command is not automatically safe to retry. Preserve its identifiers and reconcile its outcome from private events and targeted account/order reads before issuing a replacement.

Global has no mapped sandbox. See the [Global client reference](/api/classes/CBAdvancedTradeGlobalClient) and [WebSocket API reference](/api/classes/WebsocketAPIClient) for supported methods.

[Choose another API](/products) · [Authentication reference](/api/classes/CBAdvancedTradeGlobalClient)
