---
title: "Binance SDK configuration"
description: "Select Binance environments and configure request timeouts and client options."
---

# Configuration

## Configure a REST client

<<< @/../examples/configure-rest.ts

The first constructor argument contains SDK settings such as `testnet`, `api_key`, `api_secret` and `recvWindow`. The second contains Axios request options, including `timeout` in milliseconds.

The example selects Spot Testnet and a ten-second HTTP timeout. `recvWindow` is the signed request acceptance window; it is separate from the HTTP timeout.

## Select a market and environment

`MainClient` uses Spot endpoints. `USDMClient` and `CoinMClient` target their respective futures products. Select the client first, then choose an environment supported by that product. `testnet: true` selects the supported test endpoint for the client; demo trading uses the separate `demoTrading` setting.

Do not reuse a Spot key or symbol assumption across all products. Check the [upstream Binance documentation](https://developers.binance.com/docs/binance-spot-api-docs) for the product you intend to use.

## Preserve decimal precision

Leave `beautifyResponses` disabled when you want the original response representation. Parse decimal strings deliberately for calculations and format order quantities against the relevant instrument filters.

## Reuse clients

Create a client for each credential and environment combination, then reuse it across requests. Manage concurrency in your application. Creating a new client for every request is unnecessary.

[Client reference](/api/classes/MainClient) · [Production usage](/guides/production)
