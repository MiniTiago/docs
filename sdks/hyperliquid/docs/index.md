---
title: Hyperliquid API SDK for Node.js, JavaScript and TypeScript
description: Use @siebly/hyperliquid-api in Node.js to query market data and accounts, submit signed actions, and receive WebSocket updates. Start with runnable JavaScript and TypeScript examples.
---

<script setup>
import sdk from './.vitepress/generated.json';
</script>

# Hyperliquid API SDK

`@siebly/hyperliquid-api` provides JavaScript and TypeScript clients for Hyperliquid market data, account queries, signed trading actions and WebSocket subscriptions.

Build trading bots and automate your strategies in Node.js, or use real-time market data in a dashboard. Start with a public price request, then add authentication and order handling for your trading workflow.

<p class="sdk-release">JavaScript &amp; TypeScript <span>·</span> v{{ sdk.version }} <template v-if="sdk.license"><span>·</span> {{ sdk.license }} license</template></p>

## Installation

<!--@include: ./.vitepress/snippets/installation.md-->

## First request {#usage}

Follow the [Node.js quickstart](/getting-started) to read a public BTC price. It includes the complete JavaScript program, run command and expected output. No credentials are needed.

## Clients

| Client                                                  | Purpose                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`RestClient`](/api/classes/RestClient)                 | Query market data and account state, or submit signed actions over HTTP. |
| [`WebsocketClient`](/api/classes/WebsocketClient)       | Subscribe to market data and account updates.                            |
| [`WebsocketAPIClient`](/api/classes/WebsocketAPIClient) | Call the REST client's methods over a WebSocket connection.              |

See [Clients](/clients) for setup and cleanup, or the [API reference](/reference) for methods and types.

## Common tasks

| Task                                 | Guide                                         |
| ------------------------------------ | --------------------------------------------- |
| Read prices, order books and candles | [Market data](/guides/market-data)            |
| Receive market updates               | [WebSocket subscriptions](/guides/websockets) |
| Query accounts or configure a signer | [Authentication](/guides/authentication)      |
| Choose a network and set timeouts    | [Configuration](/guides/configuration)        |

## Using the SDK

[Error handling](/guides/errors) covers failed requests and rejected orders. [Production usage](/guides/production) covers retries, recovery and shutdown. Start with [Troubleshooting](/guides/troubleshooting) for a specific failure.

For a longer walkthrough, see the [Hyperliquid JavaScript tutorial on Siebly.io](https://siebly.io/sdk/hyperliquid/javascript/tutorial).
