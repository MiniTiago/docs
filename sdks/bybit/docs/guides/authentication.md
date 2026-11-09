---
title: "Bybit SDK authentication"
description: "Configure Bybit credentials and select the matching environment."
---

# Authentication

Public market data needs no credentials. Account queries and trading require an API key with the relevant permissions.

## Configure credentials

Set the environment variables below to configure a Bybit Testnet client.

<<< @/../examples/authenticated-client.ts

Store credentials in server-side environment variables or a secret manager, outside source files and browser bundles. Creating the client alone does not verify credentials or permissions.

## Verify account access

Use credentials created for Bybit Testnet, with permission to read the account. Store them in your server environment, or create a local `.env` file:

```dotenv
# Use your own Bybit Testnet credentials.
BYBIT_API_KEY=example_testnet_key
BYBIT_API_SECRET=example_testnet_secret
```

Exclude `.env` from version control and leave `BYBITTRACE` unset to avoid logging signed requests. This example only reads account data.

This example queries a Unified Trading Account with `accountType: 'UNIFIED'`. Use an account type supported by your account; see the [wallet-balance endpoint documentation](https://bybit-exchange.github.io/docs/v5/account/wallet-balance).

After installing the SDK, save this plain JavaScript example as `account.mjs`:

<<< @/../examples/account-state.ts{js}

Run it with Node.js 24:

```sh
node --env-file=.env account.mjs
```

If you already supplied the variables through your server environment, use `node account.mjs` instead. A successful request prints `Account access verified.` and the number of returned records. Use the returned account data to inspect balances in your application.

The response includes `result.list[].coin` for your application to inspect. See [`getWalletBalance()`](/api/classes/RestClientV5#getwalletbalance) for the response type and [Error handling](/guides/errors) for safe diagnostics.

## Match the environment and account

Mainnet, Testnet and demo trading use separate credentials. REST and WebSocket clients default to Mainnet. Select Testnet with `testnet: true`, or demo trading with `demoTrading: true` and `testnet: false`. Match credentials, permissions and IP restrictions to the selected environment; see [configuration](/guides/configuration#select-an-environment).

## Place an order

Once account access works, follow [Place and cancel an order](/guides/orders). The guide places a Testnet order and uses its returned order ID to query and cancel it. To receive live status changes, use [Private order updates](/guides/private-streams).

## Signing and timestamps

The SDK signs private requests. Keep the host clock synchronized, since signed requests include a timestamp.

[Configuration](/guides/configuration) · [Troubleshooting](/guides/troubleshooting) · [Exchange authentication documentation](https://bybit-exchange.github.io/docs/v5/intro)
