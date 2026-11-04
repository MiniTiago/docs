---
title: "Bybit API SDK for Node.js, JavaScript and TypeScript"
description: "Install bybit-api for Bybit REST and WebSocket APIs. Read market data, query accounts and manage orders in Node.js, with runnable JavaScript and TypeScript examples."
---

<script setup>
import sdk from './.vitepress/generated.json';
</script>

# Bybit API SDK

`bybit-api` provides JavaScript and TypeScript clients for Bybit REST and WebSocket APIs, covering market data, account queries and trading.

Build trading bots and automate your Bybit strategies in Node.js, or use real-time market data in a dashboard. Start with a public price request, then add authentication and order handling for your trading workflow.

<p class="sdk-release">JavaScript &amp; TypeScript <span>·</span> v{{ sdk.version }} <span>·</span> {{ sdk.license }} license</p>

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

<!--@include: @/.vitepress/shared/getting-started/environments.md-->

## Usage

This request reads the BTCUSDT Spot price and requires no API key.

<<< @/../examples/first-call.ts{js}

The example checks `retCode` and prints the first ticker's price. See the [Node.js quickstart](/getting-started) to run it.

## Choose a client

<!--@include: ./clients.md#client-list-->

## Next steps

- [Run your first request](/getting-started).
- [Read an order book](/guides/market-data).
- [Subscribe to live market updates](/guides/websockets).
- [Configure authentication](/guides/authentication).
- [Prepare for production](/guides/production) or [troubleshoot a problem](/guides/troubleshooting).
- [Browse the complete API reference](/reference).

For a longer walkthrough, see the [Bybit JavaScript tutorial on Siebly.io](https://siebly.io/sdk/bybit/javascript/tutorial).
