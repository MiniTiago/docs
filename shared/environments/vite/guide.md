---
title: @@SDK@@ Vite JavaScript API quickstart
description: Use the @@SDK@@ API in a plain JavaScript browser page built with Vite. Display public BTC REST and WebSocket prices.
---

# Vite (plain JavaScript) quickstart

Build a page that displays a public @@SYMBOL@@ REST price and live WebSocket updates from `@@PACKAGE@@`. No API key is needed. @@PRICE_KIND@@

Use Node.js 24 and npm. You can also [view the complete @@SDK@@ Vite example on GitHub](@@EXAMPLE_URL@@).

See [Runtime compatibility](/compatibility) for runtime requirements.

## Create the project

@@PROJECT_SETUP@@

@@APP_FILES@@

## Run

```sh
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173/`. The page shows a REST price and a changing WebSocket price. Click **Stop stream** to close the client. Navigation and Vite hot replacement also close the connection. Returning with Back or Forward starts a fresh subscription after a cached-page restoration, unless you clicked Stop stream.

To check the production bundle:

```sh
npm run build
npm run preview
```

Open the preview URL printed by Vite. Both price fields should contain positive numbers, such as `65000.5`. REST and streaming prices may differ.

## Troubleshooting

- @@POLYFILL_TROUBLE@@
- Run the page through Vite, rather than opening `index.html` directly. Check the browser network panel for blocked REST or WSS requests. The exchange must permit your origin and region; a successful bundle alone does not prove network access.
- Keep private keys and API secrets on a server. This page uses public market data. See [WebSocket subscriptions](/guides/websockets) for subscription details.
