---
title: "Coinbase API SDK for Node.js, JavaScript and TypeScript"
description: "Use coinbase-api for Advanced Trade, Global derivatives and other Coinbase REST and WebSocket APIs."
---

<script setup>
import sdk from './.vitepress/generated.json';
</script>

# Coinbase API SDK

[`coinbase-api`](https://www.npmjs.com/package/coinbase-api) provides typed JavaScript and TypeScript clients for Coinbase REST APIs and WebSockets. Start with Advanced Trade market data, then add account access and order management.

<p class="sdk-release">JavaScript &amp; TypeScript <span>·</span> v{{ sdk.version }} <span>·</span> {{ sdk.license }} license</p>

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

## First request {#usage}

The [Node.js quickstart](/getting-started) reads a public Bitcoin price without credentials.

## Choose a client

<!--@include: ./clients.md#client-list-->

Coinbase's API families have different accounts, credentials and protocols. These guides focus on **Advanced Trade** unless stated otherwise.

## Next steps

- [Read market data](/guides/market-data) or [subscribe to updates](/guides/websockets).
- [Configure credentials](/guides/authentication) and [manage orders](/guides/orders).
- [Observe private account updates](/guides/private-streams).
- [Choose another Coinbase API](/products).
- [Prepare for production](/guides/production) or [browse the reference](/reference).
