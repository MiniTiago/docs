---
title: Hyperliquid Node.js quickstart with JavaScript
description: Install @siebly/hyperliquid-api and make your first REST request in Node.js. Read the BTC mid price with plain JavaScript, without a wallet, private key or TypeScript compiler.
---

# Node.js quickstart with JavaScript

Install [`@siebly/hyperliquid-api`](https://www.npmjs.com/package/@siebly/hyperliquid-api) and retrieve the BTC mid price with one REST request in Node.js. The example is plain JavaScript and needs no TypeScript compiler, wallet or private key.

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

<!--@include: @/.vitepress/shared/getting-started/runtime-compatibility.md-->

## Make a request

Save this as `prices.mjs` in the project where the package is installed.

<<< @/../examples/first-call.ts{js}

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

## Module formats

The `.mjs` extension tells Node.js to use ES modules and `import`. For CommonJS, use a `.cjs` file with `const { RestClient } = require('@siebly/hyperliquid-api')` and keep the async `main()` function. The [complete Node.js project](/environments/node) includes both formats. TypeScript projects can use the same imports and the included type definitions; the [Node.js TypeScript guide](/environments/typescript) adds a compiler configuration and build commands.

## Choose a client

| Your task | Client |
| --- | --- |
| Make an HTTP request and await the result | [`RestClient`](/api/classes/RestClient) |
| Receive market data and account updates | [`WebsocketClient`](/api/classes/WebsocketClient) |
| Make an awaitable request over WebSocket | [`WebsocketAPIClient`](/api/classes/WebsocketAPIClient) |

## Next steps

- [Read an order book or candle history](/guides/market-data).
- [Stream prices over WebSocket](/guides/websockets).
- [Choose a network and configure request timeouts](/guides/configuration).
- [Read account state and configure a signer](/guides/authentication).
- [Configure retries, recovery and shutdown for production](/guides/production).
- [Follow the full Hyperliquid JavaScript tutorial on Siebly.io](https://siebly.io/sdk/hyperliquid/javascript/tutorial).
