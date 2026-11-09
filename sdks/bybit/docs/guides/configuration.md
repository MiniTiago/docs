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

Choose credentials for the environment you want to use:

- **Mainnet:** leave `testnet` and `demoTrading` false or omitted, and use production credentials.
- **Testnet:** set `testnet: true` and use Testnet credentials.
- **Demo trading:** set `demoTrading: true` with `testnet: false`, and use credentials from your Bybit Demo Trading account. This supports system testing with live market data and simulated orders.

For REST and private WebSocket connections, `demoTrading` takes precedence if both flags are enabled. Demo trading has its own supported endpoints and rate limits; see [Bybit's demo documentation](https://bybit-exchange.github.io/docs/v5/demo).

## Rate-limit information

`parseAPIRateLimits: true` adds `rateLimitApi` from the response headers when available. Use it alongside [Bybit's endpoint limits](https://bybit-exchange.github.io/docs/v5/rate-limit) to schedule requests.

## Reuse clients

Reuse a client for each credential and environment combination. Limit concurrent requests in the application.

[Client reference](/api/classes/RestClientV5) · [Production usage](/guides/production)
