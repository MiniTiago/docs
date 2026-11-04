---
title: @@SDK@@ React API quickstart
description: Use the @@SDK@@ API in a React component. Display BTC REST and WebSocket prices, with effect cleanup, using a complete Vite project.
---

# React quickstart

Display public BTC REST and WebSocket prices from `@@PACKAGE@@` in a React component. No API key is needed. @@PRICE_KIND@@ This is a React browser app built with Vite; the [plain JavaScript Vite guide](/environments/vite) uses DOM elements directly.

## Create the project

Use Node.js 24 with npm. [Download the complete React starter](/starters/react.tar.gz), or copy every file below.

@@SETUP@@

The SDK installs from `latest`. This project uses React @@REACT@@, Vite @@VITE@@ and the React plugin @@REACT_PLUGIN@@. @@CONFIG_NOTE@@

## Project files

@@FILES@@

## Run

```sh
npm run dev
```

Open Vite's printed URL, normally `http://localhost:5173/`. Both price fields should display positive numbers such as `65000.5`. Tap **Stop stream** to unmount the price component and close its WebSocket. **Start stream** mounts a new component and creates a fresh subscription.

The effect ignores late REST responses after unmount. Its cleanup closes the client on unmount and before a replacement effect. React StrictMode deliberately performs an extra setup and cleanup in development. The same cleanup handles it; the entry module also unmounts the root when the page closes or Vite replaces that module. See [React's effect lifecycle](https://react.dev/reference/react/useEffect#connecting-to-an-external-system).

Build and preview the production app:

```sh
npm run build
npm run preview
```

## Troubleshooting

- @@POLYFILL_TROUBLE@@
- A brief extra connection in development is expected under StrictMode. Repeated updates after **Stop stream** mean cleanup is missing from the component you copied.
- Keep the SDK import inside this browser app's helper, not a private-key signing flow. API secrets belong on a server. This example covers public market data.
- For network failures, inspect the browser's HTTPS and WSS requests to the endpoints in `market.js`. Exchange CORS and regional restrictions apply. See [Runtime compatibility](/compatibility) for the underlying browser recipe's recorded evidence and [WebSocket subscriptions](/guides/websockets) for subscription details.
