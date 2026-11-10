---
title: "Binance SDK authentication"
description: "Configure Binance credentials and select the matching environment."
---

# Authentication

Public market data needs no credentials. Account queries and trading require an API key with the relevant permissions.

## Configure credentials

The examples below select Spot Testnet with `testnet: true`. Set the matching credentials through environment variables. Set `testnet: false` (or omit it) and use production credentials to connect to the production Spot APIs.

<<< @/../examples/authenticated-client.ts

Keep API credentials in a secure server-side environment, supplied through protected environment variables or a secret manager, outside source files and browser bundles. Creating the client alone does not verify credentials or permissions.

## Verify account access

To run these examples on Spot Testnet, use credentials created for **Binance Spot Testnet**, with permission to read the account. For local development, create a private `.env` file:

```dotenv
# Fictitious values; use your own Spot Testnet credentials.
BINANCE_API_KEY=example_testnet_key # API key
BINANCE_API_SECRET=example_testnet_secret # API secret
```

Add `.env` to `.gitignore`. This server-side request reads account data; it does not place orders.

This example queries a Spot Testnet account. Futures and Portfolio Margin use different clients and account endpoints.

After installing the SDK, save this plain JavaScript example as `account.mjs`:

<<< @/../examples/account-state.ts{js}

Run it with Node.js 24:

```sh
node --env-file=.env account.mjs
```

If you already supplied the variables through your server environment, use `node account.mjs` instead. A successful request prints `Account access verified.` and the number of returned records. Use the returned account data to inspect balances in your application.

The response includes `balances` for your application to inspect. See [`getAccountInformation()`](/api/classes/MainClient#getaccountinformation) for the response type and [Error handling](/guides/errors) for safe diagnostics.

## Match the environment and account

Use keys for the selected Binance product and environment. Check key permissions and IP restrictions if an account request fails.

## Place an order

Once account access works, follow [Place and cancel an order](/guides/orders). Start [Private order updates](/guides/private-streams) first, then use the order guide to submit and cancel through REST. WebSocket events report the lifecycle changes; REST status queries are available for diagnosis and recovery.

## Signing and timestamps

The SDK signs private requests. Keep the host clock synchronized, since signed requests include a timestamp.

[Configuration](/guides/configuration) · [Troubleshooting](/guides/troubleshooting) · [Exchange authentication documentation](https://developers.binance.com/docs/binance-spot-api-docs)
