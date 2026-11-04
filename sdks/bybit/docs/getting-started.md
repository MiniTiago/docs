---
title: "Get started with the Bybit JavaScript SDK"
description: "Install bybit-api and make a public BTCUSDT price request without API credentials."
---

# Quickstart

Read a Spot price with `RestClientV5`. No account credentials are required.

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

<!--@include: @/.vitepress/shared/getting-started/runtime-compatibility.md-->

## Make a request

Save this example as `prices.mjs` in your project.

<<< @/../examples/first-call.ts

Run it with:

```sh
node prices.mjs
```

## Example output {#verify-the-result}

```text
BTCUSDT last price: 65000.00
```

`getTickers()` returns tickers in `result.list`. The example checks `retCode === 0` before reading the first price.

## Module formats

The `.mjs` extension enables ES modules. In a CommonJS `.cjs` file, use `const { RestClientV5 } = require('bybit-api')` and keep the async `main()` function. TypeScript projects can use the same imports.

## Next steps

Read [Market data](/guides/market-data), select a [client](/clients), or [subscribe to WebSocket updates](/guides/websockets). If the request fails, start with [Troubleshooting](/guides/troubleshooting).

[getTickers reference](/api/classes/RestClientV5#gettickers)
