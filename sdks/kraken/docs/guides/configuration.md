---
title: "Kraken SDK configuration"
description: "Configure Kraken REST timeouts and select the appropriate market and credentials."
---

# Configuration

## Configure a REST client

<<< @/../examples/configure-rest.ts

The first argument contains SDK options such as `apiKey` and `apiSecret`. The second contains Axios request options. Here, `timeout: 10000` sets a ten-second HTTP timeout.

Reuse a client for each account and product rather than creating one for every request.

## Environments

The clients use Kraken's live APIs by default. Spot has no public testnet. Kraken retired the Futures demo environment on 14 July 2026; in the current SDK, `testnet: true` throws instead of connecting to a retired service.

Use public market-data reads or [Spot order validation](/guides/orders) when developing without placing an order. Validation is not simulated trading and does not test fills or a complete order lifecycle.

[Kraken's Futures testing-environment notice](https://support.kraken.com/articles/360024809011-api-testing-environment-derivatives)

## Credentials and products

Use Spot credentials with `SpotClient` and private Spot streams; use Futures credentials with `DerivativesClient` and private Futures streams. The [authentication guide](/guides/authentication) shows secure configuration for Spot.

For streaming, pass a connection key from `WS_KEY_MAP` to `subscribe()`. For example, `spotPublicV2` selects public Spot v2 data and `spotPrivateV2` selects private Spot v2 data.

[Production usage](/guides/production) · [Error handling](/guides/errors)
