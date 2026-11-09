---
title: "Binance API SDK for Node.js, JavaScript and TypeScript"
description: "Install binance for Binance REST and WebSocket APIs. Read market data, query accounts and manage orders in Node.js, with runnable JavaScript and TypeScript examples."
---

<script setup>
import sdk from './.vitepress/generated.json';
</script>

# Binance API SDK

`binance` provides JavaScript and TypeScript clients for Binance REST and WebSocket APIs, covering market data, account queries and trading.

Build trading bots and automate your Binance strategies in Node.js, or use real-time market data in a dashboard. Start with a public price request, then add authentication and order handling for your trading workflow.

<p class="sdk-release">JavaScript &amp; TypeScript <span>·</span> v{{ sdk.version }} <span>·</span> {{ sdk.license }} license</p>

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

## First request {#usage}

Follow the [Node.js quickstart](/getting-started) to read a public BTC price. It includes the complete JavaScript program, run command and expected output. No credentials are needed.

## Choose a client

<!--@include: ./clients.md#client-list-->

## Next steps

- [Run your first request](/getting-started).
- [Read an order book](/guides/market-data).
- [Subscribe to live market updates](/guides/websockets).
- [Configure authentication](/guides/authentication).
- [Prepare for production](/guides/production) or [troubleshoot a problem](/guides/troubleshooting).
- [Browse the complete API reference](/reference).

For a longer walkthrough, see the [Binance JavaScript tutorial on Siebly.io](https://siebly.io/sdk/binance/javascript/tutorial).

<!--@include: @/.vitepress/shared/getting-started/environments.md-->
