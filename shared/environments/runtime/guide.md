---
title: @@SDK@@ @@TITLE@@ API quickstart
description: Use the @@SDK@@ API with @@TITLE@@. Create a direct REST price script and optionally receive a WebSocket update with cleanup.
---

# @@TITLE@@ quickstart

Read a public @@SYMBOL@@ price with `@@PACKAGE@@`. No API key is needed. @@PRICE_KIND@@

Install @@TITLE@@ first. You can also [view the complete @@SDK@@ @@TITLE@@ example on GitHub](@@EXAMPLE_URL@@).

## Create the project

@@PROJECT_SETUP@@

@@CONFIG_FILES@@

## Read a price

@@PRICE_FILES@@

Run it:

@@PRICE_RUN@@

```text
@@SYMBOL@@ REST price: 65000.5
```

## Stream a price (optional)

@@STREAM_FILES@@

Run it:

@@STREAM_RUN@@

The script receives one update, closes the client in `finally` and exits. SDK connection logs may also appear:

```text
@@SYMBOL@@ WebSocket price: 65001.2
WebSocket closed.
```

## Troubleshooting

@@TROUBLE@@

- If a request fails or no update arrives within 30 seconds, check HTTPS and WSS access to the exchange from your network and region.
- See [Runtime compatibility](/compatibility) for tested versions and [WebSocket subscriptions](/guides/websockets) for continuous streams.
