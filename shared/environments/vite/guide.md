---
title: @@SDK@@ Vite JavaScript API quickstart
description: Use the @@SDK@@ API in a plain JavaScript browser page built with Vite. Display public BTC REST and WebSocket prices.
---

# Vite (plain JavaScript) quickstart

Build a page that displays a public BTC REST price and live WebSocket updates from `@@PACKAGE@@`. No API key is needed. @@PRICE_KIND@@

## Create the project

Use Node.js with npm. [Download the complete Vite starter](/starters/vite.tar.gz), or create an empty directory and copy all files below.

@@SETUP@@

The SDK installs from `latest`. Vite @@VITE@@ is the tested build tool. @@CONFIG_NOTE@@ See [Runtime compatibility](/compatibility) for the recorded browser execution results.

## Project files

@@FILES@@

## Run

@@RUN@@

Open the URL printed by Vite, normally `http://localhost:5173/`. The page shows a REST price and a changing WebSocket price. Click **Stop stream** to close the client. Navigation and Vite hot replacement also close the connection.

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
