---
title: "Bybit SDK configuration"
description: "Select Bybit environments and configure request timeouts and client options."
---

# Configuration

## Configure a REST client

<<< @/../examples/configure-rest.ts

The first constructor argument contains SDK settings such as `testnet`, `key`, `secret` and `recv_window`. The second contains Axios request options, including `timeout` in milliseconds.

The example selects Testnet and a ten-second HTTP timeout. `recv_window` controls the signed request acceptance window; it is not the HTTP timeout.

## Select an environment

The default is the live environment. Set `testnet: true` for Testnet. Demo trading uses the separate `demoTrading` option; it is not interchangeable with Testnet. Use credentials created for the selected environment, and consult [Bybit's demo documentation](https://bybit-exchange.github.io/docs/v5/demo) for supported endpoints.

## Rate-limit information

`parseAPIRateLimits: true` adds parsed endpoint limit information to `rateLimitApi` when the response headers support it. Use the [current Bybit limits](https://bybit-exchange.github.io/docs/v5/rate-limit) to design request scheduling; do not assume every endpoint has the same allowance.

## Reuse clients

Create a client for each credential and environment combination, then reuse it across requests. Manage concurrency in your application. Creating a new client for every request is unnecessary.

[Client reference](/api/classes/RestClientV5) · [Production usage](/guides/production)
