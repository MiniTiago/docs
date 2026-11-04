---
title: "Binance SDK authentication"
description: "Configure Binance credentials and select the matching environment."
---

# Authentication

Public market data does not need credentials. Private account queries and trading endpoints require API credentials with the appropriate permissions.

## Configure credentials

Set the environment variables shown below using credentials for the selected test environment. This example creates a client; it does not submit an order.

<<< @/../examples/authenticated-client.ts

Keep credentials in your server environment or secret manager. Do not embed them in browser bundles or commit them with examples.

## Match the environment and account

Check the API product, live versus test environment, key permissions and any IP allowlist. A key for one environment is not automatically valid in another. Start with a read-only account endpoint before adding trading permissions.

## Signing and timestamps

The SDK signs private requests using the credentials you supply. Keep the host clock synchronized. Signature or timestamp errors should be investigated before retrying a state-changing request.

[Configuration](/guides/configuration) · [Troubleshooting](/guides/troubleshooting) · [Exchange authentication documentation](https://developers.binance.com/docs/binance-spot-api-docs)
