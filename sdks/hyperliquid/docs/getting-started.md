---
title: Get started with the Hyperliquid JavaScript SDK
description: Install @siebly/hyperliquid-api and read the BTC mid price in Node.js without a wallet or private key.
---

# Quickstart

Install `@siebly/hyperliquid-api` and retrieve the BTC mid price. This public request does not require a wallet or private key.

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

<!--@include: @/.vitepress/shared/getting-started/runtime-compatibility.md-->

## Make a request

Save this as `prices.mjs` in the project where the package is installed.

<<< @/../examples/first-call.ts

Run the script:

```sh
node prices.mjs
```

## Example output {#verify-the-result}

`getAllMids()` returns a map of coin names to price strings. The script prints the `BTC` entry, for example:

```text
BTC mid price: 65000.5
```

The request uses Mainnet by default and returns prices as strings.

[getAllMids reference](/api/classes/RestClient#getallmids) · [Error handling](/guides/errors)

For import errors, failed requests or a missing BTC price, see [Troubleshooting](/guides/troubleshooting).

<!--@include: @/.vitepress/shared/getting-started/environments.md-->

## Module formats

The `.mjs` extension enables ES modules. For CommonJS, use a `.cjs` file with `const { RestClient } = require('@siebly/hyperliquid-api')` and keep the async `main()` function. TypeScript projects can use the same imports and the included type definitions.

## Choose a client

| Your task | Client |
| --- | --- |
| Make an HTTP request and await the result | [`RestClient`](/api/classes/RestClient) |
| Receive market data and account updates | [`WebsocketClient`](/api/classes/WebsocketClient) |
| Make an awaitable request over WebSocket | [`WebsocketAPIClient`](/api/classes/WebsocketAPIClient) |

## Next steps

- [Read an order book or candle history](/guides/market-data).
- [Stream prices over WebSocket](/guides/websockets).
- [Configure Testnet and request timeouts](/guides/configuration).
- [Read account state and configure a signer](/guides/authentication).
- [Configure retries, recovery and shutdown for production](/guides/production).
- [Follow the full Hyperliquid JavaScript tutorial on Siebly.io](https://siebly.io/sdk/hyperliquid/javascript/tutorial).
