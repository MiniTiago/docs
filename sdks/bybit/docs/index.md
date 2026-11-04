---
title: "Bybit SDK for JavaScript and TypeScript"
description: "Install bybit-api, query public market data and explore the Siebly Bybit SDK API reference."
---

<script setup>
import sdk from './.vitepress/generated.json';
</script>

# Bybit SDK

`bybit-api` is a JavaScript and TypeScript SDK for Bybit's REST APIs and WebSockets. Start with public market data, then add authenticated account queries and trading workflows.

<p class="sdk-release">JavaScript &amp; TypeScript <span>·</span> v{{ sdk.version }} <span>·</span> {{ sdk.license }} license</p>

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

## Usage

This request reads the BTCUSDT Spot price and requires no API key.

<<< @/../examples/first-call.ts

`getTickers()` returns a response envelope. Check `retCode === 0` before reading `result.list`. The `category` selects the market; these examples use `spot`. A symbol such as `BTCUSDT` may also exist in a derivatives category.

## Choose a client

| Client | Purpose |
| --- | --- |
| `RestClientV5` | Current V5 market data, account queries and trading endpoints over HTTP. |
| `WebsocketClient` | Public and private subscriptions through `subscribeV5()`, with `update` events. |
| `WebsocketAPIClient` | Supported awaitable operations over the Bybit WebSocket API. |

## Next steps

- [Run your first request](/getting-started).
- [Read an order book](/guides/market-data).
- [Subscribe to live market updates](/guides/websockets).
- [Configure authentication](/guides/authentication).
- [Prepare for production](/guides/production) or [troubleshoot a problem](/guides/troubleshooting).
- [Browse the complete API reference](/reference).

For a longer walkthrough, see the [Bybit JavaScript tutorial on Siebly.io](https://siebly.io/sdk/bybit/javascript/tutorial).
