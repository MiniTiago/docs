---
title: Get started with the Hyperliquid JavaScript SDK
description: Install @siebly/hyperliquid-api and read Hyperliquid mid prices with a typed Node.js client. Start with a public request that needs no wallet.
---

# Quickstart

Install `@siebly/hyperliquid-api` and retrieve the BTC mid price. This public request does not require a wallet or private key.

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

<!--@include: @/.vitepress/shared/getting-started/runtime-compatibility.md-->

## Make a request

Save the following code as `prices.mjs` in the project where you installed the package.

<<< @/../examples/first-call.ts

Run the script:

```sh
node prices.mjs
```

## Verify the result

`getAllMids()` returns a map of coin names to price strings. The script prints the `BTC` entry, for example:

```text
BTC mid price: 65000.5
```

This is illustrative output; the price changes with the market. The request uses Mainnet by default. Prices remain strings in the response, so convert them only when your application needs another representation.

[getAllMids reference](/api/classes/RestClient#getallmids) · [Error handling](/guides/errors)

If the script fails, check the [installation and import steps](/guides/troubleshooting#installation-and-imports), or use the error's status and code to [diagnose the request](/guides/troubleshooting#request-failures). If BTC is absent, [check the market name and network](/guides/troubleshooting#a-mid-price-is-missing).

## Module formats

The package provides ES module and CommonJS entry points. These guides use ES module imports. The `.mjs` extension lets the Quickstart run without changing your project's module setting.

In a CommonJS `.cjs` file, replace the import with `const { RestClient } = require('@siebly/hyperliquid-api')`. Keep asynchronous calls inside `main()` as shown above. TypeScript projects can use the same imports with the package's included type definitions.

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
