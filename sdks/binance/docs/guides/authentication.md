---
title: "Binance SDK authentication"
description: "Configure Binance credentials and select the matching environment."
---

# Authentication

Public market data needs no credentials. Account queries and trading require an API key with the relevant permissions.

## Configure credentials

Set the environment variables below to configure a Spot Testnet client.

<<< @/../examples/authenticated-client.ts

Store credentials in server-side environment variables or a secret manager, outside source files and browser bundles. Creating the client alone does not verify credentials or permissions.

## Verify account access

Use credentials created for **Binance Spot Testnet**, with permission to read the account. Store them in your server environment, or create a local `.env` file:

```dotenv
BINANCE_API_KEY=replace_with_your_testnet_key
BINANCE_API_SECRET=replace_with_your_testnet_secret
```

Replace both placeholders, add `.env` to `.gitignore`, and never commit or include it in a browser bundle. Keep the file private. This request reads account data; it does not place an order or move funds.

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

Once account access works, follow [Place and cancel an order](/guides/orders). The guide validates price and quantity, saves a client order ID, and queries the result before cancellation. To receive live status changes, use [Private order updates](/guides/private-streams).

## Signing and timestamps

The SDK signs private requests. Keep the host clock synchronized, since signed requests include a timestamp.

[Configuration](/guides/configuration) · [Troubleshooting](/guides/troubleshooting) · [Exchange authentication documentation](https://developers.binance.com/docs/binance-spot-api-docs)
