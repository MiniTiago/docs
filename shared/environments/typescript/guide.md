---
title: @@SDK@@ Node.js TypeScript API quickstart
description: Use the @@SDK@@ API with TypeScript in Node.js. Type-check and compile a BTC price request and WebSocket subscription using the SDK's included definitions.
---

# Node.js / TypeScript quickstart

Compile a typed public-price request and WebSocket subscription with `@@PACKAGE@@`, then run it in Node.js. No API key is needed. @@PRICE_KIND@@

## Create the project

Use Node.js 24 with npm. [Download the complete TypeScript starter](/starters/typescript.tar.gz), or copy the files below.

@@SETUP@@

The SDK installs from `latest` and includes its type definitions. This starter uses TypeScript @@TYPESCRIPT@@. Its `market.ts` imports the SDK's constructor types so the compiler checks the REST methods and subscription arguments against the installed package.

## Project files

@@FILES@@

## Run

Check types without making any exchange requests:

```sh
npm run check
```

Compile and run:

```sh
npm start
```

`npm start` runs `tsc` and then `node dist/prices.js`. It stops on a compiler error. The script prints a REST price and one WebSocket price, closes the client in `finally`, and exits:

```text
BTC REST price: 65000.5
BTC WebSocket price: 65001.2
WebSocket closed.
```

The [NodeNext compiler settings](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-node18-node20-nodenext) follow Node.js module resolution. Relative imports name the emitted `.js` files even though the source files end in `.ts`. The selected WebSocket event payload is an untyped boundary; the shared price helper validates the numeric value before presenting it.

## Troubleshooting

- Run `npm run check` to see SDK method or argument errors before execution. Keep the included `tsconfig.json` when copying this starter.
- If Node cannot find `dist/prices.js`, run `npm run build` first or use `npm start`, which builds automatically. This recipe uses `tsc` for type checking and compilation rather than relying on Node's type stripping.
- If types cannot be resolved, run `npm install` and keep both development dependencies in `package.json`.
- For HTTP failures or no update within 30 seconds, allow the exchange endpoints in `market.ts` from your network and region. See [Runtime compatibility](/compatibility) and [Troubleshooting](/guides/troubleshooting).
