---
title: @@SDK@@ Node.js TypeScript API quickstart
description: Use the @@SDK@@ API with TypeScript in Node.js. Type-check a direct REST request and optionally add a WebSocket subscription.
---

# Node.js / TypeScript quickstart

Compile a public @@SYMBOL@@ price request with `@@PACKAGE@@`, then run it in Node.js. No API key is needed. @@PRICE_KIND@@

Use Node.js 24 and npm. You can also [view the complete @@SDK@@ TypeScript example on GitHub](@@EXAMPLE_URL@@).

## Create the project

@@PROJECT_SETUP@@

The SDK installs from the current npm release and includes its own type definitions. The development dependencies supply the TypeScript compiler and Node.js types.

@@CONFIG_FILES@@

## Read a price

@@PRICE_FILES@@

Check types, compile and run:

@@PRICE_RUN@@

```text
@@SYMBOL@@ REST price: 65000.5
```

The `.mts` source compiles to `.mjs`. [NodeNext compiler settings](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-node18-node20-nodenext) follow Node.js module resolution without changing the package’s default module format.

## Stream a price (optional)

@@STREAM_FILES@@

Compile and run it:

@@STREAM_RUN@@

```text
@@SYMBOL@@ WebSocket price: 65001.2
WebSocket closed.
```

## Troubleshooting

- `npx tsc --noEmit` checks types without making exchange requests. Fix compiler errors before running the emitted JavaScript.
- If Node cannot find `dist/price.mjs` or `dist/stream.mjs`, compile with `npx tsc` first.
- If types cannot be resolved, check that both development dependencies installed successfully.
- For network or API errors, see [Troubleshooting](/guides/troubleshooting) and [Runtime compatibility](/compatibility).
