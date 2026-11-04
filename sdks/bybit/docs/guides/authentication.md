---
title: "Bybit SDK authentication"
description: "Configure Bybit credentials and select the matching environment."
---

# Authentication

Public market data needs no credentials. Account queries and trading require an API key with the relevant permissions.

## Configure credentials

Set the environment variables below to configure a Bybit Testnet client.

<<< @/../examples/authenticated-client.ts

Store credentials in server-side environment variables or a secret manager, outside source files and browser bundles.

## Match the environment and account

Live, Testnet and demo use separate credentials. Match the key to the selected environment and check its permissions and IP restrictions.

## Signing and timestamps

The SDK signs private requests. Keep the host clock synchronized, since signed requests include a timestamp.

[Configuration](/guides/configuration) · [Troubleshooting](/guides/troubleshooting) · [Exchange authentication documentation](https://bybit-exchange.github.io/docs/v5/intro)
