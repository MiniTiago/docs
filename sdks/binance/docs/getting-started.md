---
title: "Get started with the Binance JavaScript SDK"
description: "Install binance and make a public BTCUSDT price request without API credentials."
---

# Quickstart

Read a Spot price with `MainClient`. No account credentials are required.

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

Use a maintained Node.js release for these examples. The installed package includes TypeScript definitions.

<!--@include: @/.vitepress/shared/getting-started/runtime-compatibility.md-->

## Make a request

Save this example as `prices.mjs` in your project.

<<< @/../examples/first-call.ts

Run it with:

```sh
node prices.mjs
```

## Verify the result

Illustrative output:

```text
BTCUSDT last price: 65000.00
```

The actual value changes with the market. `MainClient.getSymbolPriceTicker()` returns the response data directly. Its TypeScript return type permits either one ticker or an array, so the example narrows the result before accessing `price`. These examples use Binance Spot.

## Module formats

The examples use ES module imports. The `.mjs` extension enables ES modules without changing your project's package settings. For a CommonJS `.cjs` file, replace the import with `const { MainClient } = require('binance')` and keep the async `main()` function.

TypeScript projects can use the same imports. Compile them with your project's TypeScript configuration.

## Next steps

Read [Market data](/guides/market-data), select a [client](/clients), or [subscribe to WebSocket updates](/guides/websockets). If the request fails, start with [Troubleshooting](/guides/troubleshooting).

[getSymbolPriceTicker reference](/api/classes/MainClient#getsymbolpriceticker)
