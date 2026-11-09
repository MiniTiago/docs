---
title: @@SDK@@ Next.js API quickstart
description: Use the @@SDK@@ API in a Next.js Node.js server Route Handler to return a public BTC price.
---

# Next.js server quickstart

Serve a public BTC price from a Next.js App Router Route Handler using `@@PACKAGE@@`. No API key is needed. @@PRICE_KIND@@ This example runs in the **Node.js server runtime**.

Use Node.js 24 and npm. You can also [view the complete @@SDK@@ Next.js example on GitHub](@@EXAMPLE_URL@@).

See [Runtime compatibility](/compatibility) for runtime requirements.

## Create the project

@@PROJECT_SETUP@@

@@APP_FILES@@

## Run

```sh
npm run dev
```

Open `http://localhost:3000/api/price`, or request it in a second terminal:

```sh
curl --fail http://localhost:3000/api/price
```

A successful response contains a positive price string, for example:

```json
{
  "symbol": "@@SYMBOL@@",
  "price": "65000.5"
}
```

Check the production server with:

```sh
npm run build
npm start
```

The handler makes a fresh REST request for each call. It does not open a WebSocket. To receive a WebSocket update in a standalone process, use the [Node.js](/environments/node), [Bun](/environments/bun) or [Deno](/environments/deno) example. Each closes its subscription explicitly. The [Vite example](/environments/vite) shows browser subscription cleanup.

## Troubleshooting

- Keep `runtime = 'nodejs'` in the handler. Run SDK calls in the server Route Handler, not a Client Component or the Edge runtime.
- A `502` means the SDK request failed. Inspect the server log for the exchange error and check outbound HTTPS access from the server, including regional restrictions.
- If Next.js reports a missing React package, run `npm install` from the directory containing this starter's `package.json`.
