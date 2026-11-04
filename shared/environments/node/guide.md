---
title: @@SDK@@ Node.js JavaScript API quickstart
description: Use the @@SDK@@ API in Node.js with plain JavaScript. Run import or require examples that read a BTC price, subscribe to WebSockets and close the connection.
---

# Node.js / JavaScript quickstart

Read a public BTC price and receive a WebSocket update with `@@PACKAGE@@` in Node.js. No API key or TypeScript compiler is needed. @@PRICE_KIND@@

## Create the project

Use Node.js 24 with npm. [Download the complete Node.js JavaScript starter](/starters/node.tar.gz), or copy the files below.

@@SETUP@@

The SDK installs from `latest`. The archive contains both an `import` example and a `require` example. Choose either command below; both make the same public requests.

## Project files

@@FILES@@

## Run

For ES modules with `import`:

```sh
npm start
# Equivalent: node prices.js
```

For CommonJS with `require`:

```sh
npm run start:require
# Equivalent: node prices.cjs
```

Both examples print a REST price and the first valid WebSocket price, close the client in `finally`, then exit. SDK connection logs may also appear.

```text
BTC REST price: 65000.5
BTC WebSocket price: 65001.2
WebSocket closed.
```

The `.js` files use `import` because `package.json` sets `"type": "module"`. The `.cjs` files use `require` even in that project. These are [Node.js module rules](https://nodejs.org/api/packages.html#packagejson-and-file-extensions), not a TypeScript requirement.

## Troubleshooting

- If Node says `require is not defined`, use `prices.cjs` for the CommonJS example. If it rejects `import`, keep `"type": "module"` for the `.js` files.
- If the SDK cannot be resolved, run `npm install` in the directory containing `package.json`.
- For a rejected HTTP request or no update within 30 seconds, allow the HTTPS and WSS endpoints in `market.js` or `market.cjs`. Exchange regional restrictions apply.
- See [Runtime compatibility](/compatibility) for recorded runtime versions and [WebSocket subscriptions](/guides/websockets) for continuous streams and shutdown.
