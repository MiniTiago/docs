---
title: "Binance SDK for JavaScript and TypeScript"
description: "Install binance, query public market data and explore the Siebly Binance SDK API reference."
---

<script setup>
import sdk from './.vitepress/generated.json';
</script>

# Binance SDK

`binance` is a JavaScript and TypeScript SDK for Binance's REST APIs and WebSockets. Start with public market data, then add authenticated account queries and trading workflows.

<p class="sdk-release">JavaScript &amp; TypeScript <span>·</span> v{{ sdk.version }} <span>·</span> {{ sdk.license }} license</p>

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

## Usage

This request reads the BTCUSDT Spot price and requires no API key.

<<< @/../examples/first-call.ts

`MainClient.getSymbolPriceTicker()` returns the response data directly. Its TypeScript return type permits either one ticker or an array, so the example narrows the result before accessing `price`. These examples use Binance Spot.

## Choose a client

| Client | Purpose |
| --- | --- |
| `MainClient` | Spot and related account endpoints over HTTP. |
| `USDMClient` | USD-M futures endpoints. |
| `CoinMClient` | COIN-M futures endpoints. |
| `PortfolioClient` | Portfolio Margin endpoints. |
| `WebsocketClient` | Market and account streams, with raw `message` events and optional formatted events. |
| `WebsocketAPIClient` | Supported awaitable operations over Binance WebSocket APIs. |

## Next steps

- [Run your first request](/getting-started).
- [Read an order book](/guides/market-data).
- [Subscribe to live market updates](/guides/websockets).
- [Configure authentication](/guides/authentication).
- [Prepare for production](/guides/production) or [troubleshoot a problem](/guides/troubleshooting).
- [Browse the complete API reference](/reference).

For a longer walkthrough, see the [Binance JavaScript tutorial on Siebly.io](https://siebly.io/sdk/binance/javascript/tutorial).
