---
title: "Get started with the Binance JavaScript SDK"
description: "Install binance and make a public BTCUSDT price request without API credentials."
---

# Quickstart

Read a Spot price with `MainClient`. No account credentials are required.

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

`getSymbolPriceTicker()` returns one ticker or an array. The example handles both shapes and prints the price string.

## Module formats

The `.mjs` extension enables ES modules. In a CommonJS `.cjs` file, use `const { MainClient } = require('binance')` and keep the async `main()` function. TypeScript projects can use the same imports.

## Next steps

Read [Market data](/guides/market-data), select a [client](/clients), or [subscribe to WebSocket updates](/guides/websockets). If the request fails, start with [Troubleshooting](/guides/troubleshooting).

[getSymbolPriceTicker reference](/api/classes/MainClient#getsymbolpriceticker)
