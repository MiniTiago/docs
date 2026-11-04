---
title: "Get started with the Bybit JavaScript SDK"
description: "Install bybit-api and make a public BTCUSDT price request without API credentials."
---

# Quickstart

Read a Spot price with `RestClientV5`. No account credentials are required.

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

The actual value changes with the market. `getTickers()` returns a response envelope. Check `retCode === 0` before reading `result.list`. The `category` selects the market; these examples use `spot`. A symbol such as `BTCUSDT` may also exist in a derivatives category.

## Module formats

The examples use ES module imports. The `.mjs` extension enables ES modules without changing your project's package settings. For a CommonJS `.cjs` file, replace the import with `const { RestClientV5 } = require('bybit-api')` and keep the async `main()` function.

TypeScript projects can use the same imports. Compile them with your project's TypeScript configuration.

## Next steps

Read [Market data](/guides/market-data), select a [client](/clients), or [subscribe to WebSocket updates](/guides/websockets). If the request fails, start with [Troubleshooting](/guides/troubleshooting).

[getTickers reference](/api/classes/RestClientV5#gettickers)
