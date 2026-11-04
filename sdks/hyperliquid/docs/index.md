---
title: Hyperliquid SDK for JavaScript and TypeScript
description: Install the Siebly Hyperliquid SDK for JavaScript and TypeScript. Query market data and account state, submit orders, and subscribe to WebSocket updates.
---

<script setup>
import sdk from './.vitepress/generated.json';
</script>

# Hyperliquid SDK

`@siebly/hyperliquid-api` is a JavaScript and TypeScript SDK for the Hyperliquid API. It provides clients for market data, account queries, signed Exchange actions and WebSocket subscriptions.

<p class="sdk-release">JavaScript &amp; TypeScript <span>·</span> v{{ sdk.version }} <template v-if="sdk.license"><span>·</span> {{ sdk.license }} license</template></p>

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

## Usage

Create a `RestClient` and call `getAllMids()` to retrieve current mid prices. Public market data does not require a wallet or private key.

<<< @/../examples/first-call.ts

The result maps coin names to price strings. This example prints the BTC mid price. Save it as `prices.mjs` and run `node prices.mjs`.

See the [Quickstart](/getting-started) for an example result and links to common tasks.

## Clients

| Client | Purpose |
| --- | --- |
| [`RestClient`](/api/classes/RestClient) | Query market data and account state, or submit signed actions over HTTP. |
| [`WebsocketClient`](/api/classes/WebsocketClient) | Subscribe to market data and account updates. |
| [`WebsocketAPIClient`](/api/classes/WebsocketAPIClient) | Call the REST client's methods over a WebSocket connection. |

See [Clients](/clients) for initialization, usage and connection cleanup, or browse the [API reference](/reference) for method signatures and types.

## Common tasks

| Task | Guide |
| --- | --- |
| Read prices, order books and candles | [Market data](/guides/market-data) |
| Receive market updates | [WebSocket subscriptions](/guides/websockets) |
| Query accounts or configure a signer | [Authentication](/guides/authentication) |
| Choose a network and set timeouts | [Configuration](/guides/configuration) |

## Using the SDK

Use [Error handling](/guides/errors) to interpret request failures and individual order results. [Production usage](/guides/production) covers retry decisions, connection recovery, rate limits and shutdown. For a specific problem, start with [Troubleshooting](/guides/troubleshooting).

For a longer walkthrough, see the [Hyperliquid JavaScript tutorial on Siebly.io](https://siebly.io/sdk/hyperliquid/javascript/tutorial).
