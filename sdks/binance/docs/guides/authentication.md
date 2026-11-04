---
title: "Binance SDK authentication"
description: "Configure Binance credentials and select the matching environment."
---

# Authentication

Public market data needs no credentials. Account queries and trading require an API key with the relevant permissions.

## Configure credentials

Set the environment variables below to configure a Spot Testnet client.

<<< @/../examples/authenticated-client.ts

Store credentials in server-side environment variables or a secret manager, outside source files and browser bundles.

## Match the environment and account

Use keys for the selected Binance product and environment. Check key permissions and IP restrictions if an account request fails.

## Signing and timestamps

The SDK signs private requests. Keep the host clock synchronized, since signed requests include a timestamp.

[Configuration](/guides/configuration) · [Troubleshooting](/guides/troubleshooting) · [Exchange authentication documentation](https://developers.binance.com/docs/binance-spot-api-docs)
