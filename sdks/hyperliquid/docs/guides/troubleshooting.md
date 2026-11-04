---
title: Troubleshoot the Hyperliquid JavaScript SDK
description: Resolve installation and import errors, missing account data, WebSocket subscription problems, request timeouts and rejected Hyperliquid orders.
---

# Troubleshooting

Start with the symptom below. Check the network and the client you are using before changing credentials or retrying a request.

| Symptom | Start here |
| --- | --- |
| Package cannot be found or imported | [Installation and imports](#installation-and-imports) |
| A price, order book or account result is missing | [Missing or unexpected data](#missing-or-unexpected-data) |
| An account or signer error appears | [Account addresses and signing](#account-addresses-and-signing) |
| A subscription connects but no updates arrive | [WebSocket subscriptions](#websocket-subscriptions) |
| A request times out or returns an error | [Request failures](#request-failures) |
| An order request resolves but an order is rejected | [Rejected orders](#rejected-orders) |

## Installation and imports

For `ERR_MODULE_NOT_FOUND` or `Cannot find module`, run `npm ls @siebly/hyperliquid-api` in the project that runs your script. Install the package there if it is missing. Check `node --version` against the requirement shown in the [Quickstart](/getting-started#installation).

For `Cannot use import statement outside a module`, save the Quickstart example as `prices.mjs`, or configure your project to use ES modules with `"type": "module"` in `package.json`. A `.cjs` file uses CommonJS `require()` instead. See [module formats](/getting-started#module-formats).

The Quickstart example uses JavaScript-compatible syntax. Other TypeScript examples may need your project's TypeScript compiler or runner; renaming a file does not remove type annotations.

## Missing or unexpected data

### A mid price is missing

`getAllMids()` returns a map keyed by native coin name. Check the returned keys and the selected network. Do not assume every market uses the symbol shown in a user interface. The [asset-name guide](/guides/market-data#asset-names) explains native perpetual, Spot and HIP-3 names.

### An order book is null or a side is empty

`getOrderBook()` can return `null`. Check for it before reading `levels`; either bids or asks can also be empty. Verify the market identifier and network. The [order-book example](/guides/market-data#l2-order-book) handles these cases explicitly.

### Account positions are empty

An empty `assetPositions` array can be a valid result. Check that `accountAddress` is the account being queried, rather than an API wallet's signing address, and confirm Mainnet versus Testnet. Use [account queries](/guides/authentication#read-account-state) to inspect the intended account.

## Account addresses and signing

If an account query asks you to provide `user`, `accountAddress` or `vaultAddress`, the SDK could not resolve an account from the request or client configuration. Public account queries need an address, not a private key. Set `accountAddress`, or pass `user` to that request.

If the SDK reports that the signer is not a Hyperliquid account on this network, check the selected network and set `accountAddress` to the account managed by the API wallet. That setting selects the account; it does not authorize the signer. Review [API wallets and vaults](/guides/authentication#api-wallets-and-vaults).

For a rejected signed action, verify the signer is authorized for the account and action. Check that `testnet` matches any custom endpoint. See [Authentication](/guides/authentication) and [network configuration](/guides/configuration#networks).

## WebSocket subscriptions

A resolved `subscribe()` promise confirms that the subscription was sent locally. Check `response` for the server acknowledgement and `exception` for a rejection or connection failure.

Register listeners before subscribing. Read subscription data from `message` and narrow it using `channel`. Use a native coin name for channels that take `coin`; resolve an alias with `nameToCoin()` first when necessary.

If the connection is repeatedly lost, check connectivity and proxy settings, then review connection and heartbeat options in [`WebsocketClientOptions`](/api/interfaces/WebsocketClientOptions). A larger timeout does not correct an invalid subscription. See the [complete subscription example](/guides/websockets).

## Request failures

### HTTP errors and timeouts

Inspect `HyperliquidApiError.message`, `status` and `code`. `status` can be absent if no HTTP response arrived. An API-level rejection can also arrive with HTTP status `200`, so inspect the SDK error rather than the status alone.

HTTP requests are not automatically retried. Check connectivity and the endpoint for transport failures, reduce request volume when rate limited, and correct input for validation failures. Use [Error handling](/guides/errors) for the error model and [Production usage](/guides/production#timeouts-and-retries) for retry decisions.

### WebSocket request timeouts

`connectionTimeout` controls opening a socket. `requestTimeoutMs` covers an individual request, including connection setup. Use [Configuration](/guides/configuration#websocket-connections) to adjust them for your environment.

After a timeout or disconnect during a signed action, the outcome may be unknown. [Check the order state](/guides/production#check-an-order-after-a-timeout) before deciding whether to resubmit it.

## Rejected orders

A successful `submitOrder()` request can contain an `error` entry for one or more orders. Inspect each entry in `response.data.statuses`; do not infer acceptance from the fulfilled promise alone. See [Order results](/guides/errors#order-results) for the response variants.

## Collect a reproducible report

Include the SDK version (`npm ls @siebly/hyperliquid-api`), Node version, network, method, minimal example and relevant error fields. For streams, include the channel and connection events around the failure. Remove private keys, signed payloads and other sensitive values before sharing a report.

Check the [SDK issue tracker](https://github.com/sieblyio/hyperliquid-api/issues) for existing reports and fixes.
