---
title: "Bybit Node.js quickstart with JavaScript"
description: "Install bybit-api and make your first REST request in Node.js. Read the BTCUSDT Spot price with plain JavaScript, without API credentials or a TypeScript compiler."
---

# Node.js quickstart with JavaScript

Install `bybit-api` and read the BTCUSDT Spot price with one REST request from `RestClientV5` in Node.js. The example is plain JavaScript and needs no TypeScript compiler or API credentials.

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

<!--@include: @/.vitepress/shared/getting-started/runtime-compatibility.md-->

## Make a request

Save this example as `prices.mjs` in your project.

<<< @/../examples/first-call.ts{js}

Run it with:

```sh
node prices.mjs
```

## Example output {#verify-the-result}

```text
BTCUSDT last price: 65000.00
```

`getTickers()` returns tickers in `result.list`. The example enables `throwExceptions: true`, so API errors reach the `catch` handler.

## Module formats

The `.mjs` extension tells Node.js to use ES modules and `import`. In a CommonJS `.cjs` file, use `const { RestClientV5 } = require('bybit-api')` and keep the async `main()` function. The [complete Node.js project](/environments/node) includes both formats. TypeScript projects can use the same imports and the included type definitions; the [Node.js TypeScript guide](/environments/typescript) adds a compiler configuration and build commands.

## Next steps

Read [Market data](/guides/market-data), select a [client](/clients), or [subscribe to WebSocket updates](/guides/websockets). If the request fails, start with [Troubleshooting](/guides/troubleshooting).

[getTickers reference](/api/classes/RestClientV5#gettickers)
