---
title: @@SDK@@ Next.js API quickstart
description: Use the @@SDK@@ API in a Next.js Node.js server Route Handler to return a public BTC price.
---

# Next.js server quickstart

Serve a public BTC price from a Next.js App Router Route Handler using `@@PACKAGE@@`. No API key is needed. @@PRICE_KIND@@ This example runs in the **Node.js server runtime**.

## Create the project

Use Node.js with npm. [Download the complete Next.js starter](/starters/next.tar.gz), or create an empty directory and copy all files below.

@@SETUP@@

The SDK installs from `latest`. The starter uses Next.js @@NEXT@@ and React @@REACT@@, matching the server recipe in [Runtime compatibility](/compatibility).

## Project files

@@FILES@@

## Run

@@RUN@@

Open `http://localhost:3000/api/price`, or request it in a second terminal:

```sh
curl --fail http://localhost:3000/api/price
```

A successful response contains a positive price string, for example:

```json
{"symbol":"BTC","price":"65000.5"}
```

Check the production server with:

```sh
npm run build
npm start
```

The handler makes a fresh REST request for each call. It does not open a WebSocket. To receive a WebSocket update in a standalone process, use the [Bun](/environments/bun) or [Deno](/environments/deno) example, which closes its subscription explicitly. The [Vite example](/environments/vite) shows browser subscription cleanup.

## Troubleshooting

- Keep `runtime = 'nodejs'` in the handler. Client Components and the Edge runtime are outside this recipe and its server verification.
- A `502` means the exchange request failed. Inspect server network access to the HTTPS endpoint in `market.js`, including regional restrictions.
- If Next.js reports a missing React package, run `npm install` from the directory containing this starter's `package.json`.
