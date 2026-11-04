---
title: "Bybit SDK for JavaScript and TypeScript"
description: "Install bybit-api and use Bybit REST and WebSocket clients for market data, account queries and trading."
---

<script setup>
import sdk from './.vitepress/generated.json';
</script>

# Bybit SDK

`bybit-api` provides JavaScript and TypeScript clients for Bybit market data, account queries, trading and WebSocket streams.

<p class="sdk-release">JavaScript &amp; TypeScript <span>·</span> v{{ sdk.version }} <span>·</span> {{ sdk.license }} license</p>

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

## Usage

This request reads the BTCUSDT Spot price and requires no API key.

<<< @/../examples/first-call.ts

The example checks `retCode` and prints the first ticker's price. See the [Quickstart](/getting-started) to run it.

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
