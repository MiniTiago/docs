---
title: "Coinbase Node.js quickstart with JavaScript"
description: "Install coinbase-api and read a public Advanced Trade Bitcoin price without credentials."
---

# Node.js quickstart with JavaScript

Read the public Advanced Trade Bitcoin/USD product with `CBAdvancedTradeClient`. This example uses plain JavaScript, with no compiler or API credentials.

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

Use Node.js 24 for this quickstart. For other runtimes and required configuration, see [Runtime setup](/compatibility).

## Make a request

Save this as `prices.mjs`:

<<< @/../examples/first-call.ts{js}

```sh
node prices.mjs
```

## Example output {#verify-the-result}

```text
BTC-USD price: 65000
```

The price is illustrative. The method returns the product directly, not an Axios response wrapper. Public REST market data can be cached; use [WebSockets](/guides/websockets) for streaming prices.

## Module formats

The `.mjs` extension selects ES modules. For CommonJS, save a `.cjs` file and replace the import with `const { CBAdvancedTradeClient } = require('coinbase-api');`. Keep the async `main()` function. TypeScript uses the same imports with the package's included types.

The other guides use TypeScript. For their small examples, Node.js 24 can run `.ts` files directly. When copying an example that imports `./authenticated-client.js`, compile both TypeScript files with TypeScript first, or change that local import to `./authenticated-client.ts` for Node.js type stripping.

[Choose a client](/clients) · [Market data](/guides/market-data) · [Troubleshooting](/guides/troubleshooting)
