---
title: @@SDK@@ @@TITLE@@ quickstart
description: @@SDK@@ SDK. Read a public BTC price, receive a WebSocket update and close the connection with @@TITLE@@.
---

# @@TITLE@@ quickstart

Run a public BTC REST request and a WebSocket subscription with `@@PACKAGE@@`. No API key is needed. @@PRICE_KIND@@

## Create the project

Install @@TITLE@@ first. The [runtime compatibility report](/compatibility) records the versions exercised with this SDK.

[Download the complete @@TITLE@@ starter](/starters/@@ENV@@.tar.gz), or create an empty directory and copy the files below. The archive contains the same files shown on this page.

@@SETUP@@

The SDK dependency uses `latest`, so a new installation selects the current npm release.

## Project files

@@FILES@@

## Run

@@RUN@@

Alongside SDK connection logs, the script prints one REST price and the first valid WebSocket price, closes the WebSocket client in `finally`, and exits. Prices change continuously; the two values may differ.

```text
BTC REST price: 65000.5
BTC WebSocket price: 65001.2
WebSocket closed.
```

## Troubleshooting

@@TROUBLE@@

- A rejected HTTP request or no WebSocket update within 30 seconds usually needs a network check. Allow outbound HTTPS and WSS to the exchange endpoints in `market.js`. An exchange may restrict access from your region.
- For API errors, see [Troubleshooting](/guides/troubleshooting). For continuous subscriptions and shutdown, see [WebSocket subscriptions](/guides/websockets).
