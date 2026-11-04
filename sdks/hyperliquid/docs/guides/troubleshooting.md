---
title: Troubleshoot the Hyperliquid JavaScript SDK
description: Resolve installation and import errors, missing account data, WebSocket subscription problems, request timeouts and rejected Hyperliquid orders.
---

# Troubleshooting

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

Examples with TypeScript annotations need a TypeScript compiler or runner.

## Missing or unexpected data

### A mid price is missing

`getAllMids()` uses native coin names. Check its returned keys and the selected network against the [asset-name guide](/guides/market-data#asset-names).

### An order book is null or a side is empty

Check the market identifier and network. The [order-book example](/guides/market-data#l2-order-book) handles a `null` response and empty bid or ask arrays.

### Account positions are empty

Check that `accountAddress` is the managed account and that Mainnet or Testnet is correct. An account with no perpetual positions returns an empty `assetPositions` array. See [account queries](/guides/authentication#read-account-state).

## Account addresses and signing

A missing-address error means the SDK could not resolve an account. Set `accountAddress`, pass `user` to the request, or configure `vaultAddress` for a vault. These queries need no private key.

If the signer is not a Hyperliquid account on this network, check the network and set `accountAddress` to the account managed by the API wallet. The wallet also needs authorization for the action. See [API wallets and vaults](/guides/authentication#api-wallets-and-vaults).

For rejected signed actions, check signer permissions and ensure `testnet` matches any [custom endpoint](/guides/configuration#networks).

## WebSocket subscriptions

A resolved `subscribe()` promise confirms that the subscription was sent locally. Check `response` for the server acknowledgement and `exception` for a rejection or connection failure.

Register listeners before subscribing. Read subscription data from `message` and narrow it using `channel`. Use a native coin name for channels that take `coin`; resolve an alias with `nameToCoin()` first when necessary.

For repeated disconnects, check connectivity, proxy settings and the connection and heartbeat options in [`WebsocketClientOptions`](/api/interfaces/WebsocketClientOptions). See the [subscription example](/guides/websockets).

## Request failures

### HTTP errors and timeouts

Inspect `HyperliquidApiError.message`, `status` and `code`. `status` can be absent if no HTTP response arrived. An API-level rejection can also arrive with HTTP status `200`, so inspect the SDK error rather than the status alone.

HTTP requests are not automatically retried. Check connectivity and the endpoint for transport failures, reduce request volume when rate limited, and correct input for validation failures. Use [Error handling](/guides/errors) for the error model and [Production usage](/guides/production#timeouts-and-retries) for retry decisions.

### WebSocket request timeouts

`connectionTimeout` controls opening a socket. `requestTimeoutMs` covers an individual request, including connection setup. Use [Configuration](/guides/configuration#websocket-connections) to adjust them for your environment.

After a timeout or disconnect during a signed action, the outcome may be unknown. [Check the order state](/guides/production#check-an-order-after-a-timeout) before deciding whether to resubmit it.

## Rejected orders

`submitOrder()` can resolve with rejected individual orders. Check each entry in `response.data.statuses`. See [Order results](/guides/errors#order-results) for the variants.

## Collect a reproducible report

Include the SDK version (`npm ls @siebly/hyperliquid-api`), Node version, network, method, minimal example and relevant error fields. For streams, include the channel and connection events around the failure. Remove private keys, signed payloads and other sensitive values before sharing a report.

Check the [SDK issue tracker](https://github.com/sieblyio/hyperliquid-api/issues) for existing reports and fixes.
