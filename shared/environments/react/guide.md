---
title: @@SDK@@ React API quickstart
description: Use the @@SDK@@ API in a React component. Display BTC REST and WebSocket prices, with effect cleanup, using a complete Vite project.
---

# React quickstart

Display public BTC REST and WebSocket prices from `@@PACKAGE@@` in a React component. No API key is needed. @@PRICE_KIND@@ This is a React browser app built with Vite; the [plain JavaScript Vite guide](/environments/vite) uses DOM elements directly.

Use Node.js 24 and npm. You can also [view the complete @@SDK@@ React example on GitHub](@@EXAMPLE_URL@@).

See [Runtime compatibility](/compatibility) for runtime requirements.

## Create the project

@@PROJECT_SETUP@@

@@APP_FILES@@

## Run

```sh
npm run dev
```

Open Vite's printed URL, normally `http://localhost:5173/`. Both price fields should display positive numbers such as `65000.5`. Tap **Stop stream** to unmount the price component and close its WebSocket. **Start stream** mounts a new component and creates a fresh subscription.

The effect ignores late REST responses after unmount. Its cleanup closes the client on unmount and before a replacement effect. React StrictMode deliberately performs an extra setup and cleanup in development. The same cleanup handles it. The entry module pauses the price component before the browser caches the page and resumes it on Back or Forward, while preserving your Stop/Start choice. It unmounts the root when the page is discarded or Vite replaces the entry module. See [React's effect lifecycle](https://react.dev/reference/react/useEffect#connecting-to-an-external-system).

Build and preview the production app:

```sh
npm run build
npm run preview
```

## Troubleshooting

- @@POLYFILL_TROUBLE@@
- A brief extra connection in development is expected under StrictMode. Repeated updates after **Stop stream** mean cleanup is missing from the component you copied.
- This example uses public market data only. Keep private keys and API secrets on a server.
- For network failures, inspect the browser's HTTPS and WSS requests to the exchange. Exchange CORS and regional restrictions apply. See [Runtime compatibility](/compatibility) for browser configuration and [WebSocket subscriptions](/guides/websockets) for subscription details.
