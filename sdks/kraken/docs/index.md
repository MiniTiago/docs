---
title: "Kraken API SDK for Node.js, JavaScript and TypeScript"
description: "Install @siebly/kraken-api for Kraken Spot and Futures REST and WebSocket APIs, with JavaScript examples and TypeScript reference."
---

<script setup>
import sdk from './.vitepress/generated.json';
</script>

# Kraken API SDK

[`@siebly/kraken-api`](https://www.npmjs.com/package/@siebly/kraken-api) provides JavaScript and TypeScript clients for Kraken Spot and Futures REST APIs and WebSockets. Read market data, query accounts and manage orders with typed requests and responses.

Start with a public price request, then add account access and streaming updates to your application. The SDK manages request signing, WebSocket connections and resubscriptions.

<p class="sdk-release">JavaScript &amp; TypeScript <span>·</span> v{{ sdk.version }} <span>·</span> {{ sdk.license }} license</p>

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

Use the scoped package `@siebly/kraken-api`. The unscoped `kraken-api` package is a different library.

## First request {#usage}

The [Node.js quickstart](/getting-started) reads a public Bitcoin price with plain JavaScript. No API credentials are needed.

## Choose a client

<!--@include: ./clients.md#client-list-->

## Next steps

- [Read Spot and Futures market data](/guides/market-data).
- [Subscribe to ticker updates](/guides/websockets).
- [Configure account access](/guides/authentication).
- [Validate an order request](/guides/orders).
- [Receive private account updates](/guides/private-streams).
- [Prepare for production](/guides/production) or [troubleshoot a problem](/guides/troubleshooting).
- [Browse the API reference](/reference).
