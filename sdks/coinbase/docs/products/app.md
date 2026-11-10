---
title: "Coinbase App SDK"
description: "Read Coinbase App prices, wallet balances and transactions with App-specific accounts and credentials."
---

# Coinbase App

`CBAppClient` provides Coinbase App wallet/account and transaction endpoints on `api.coinbase.com`. It is a wallet API, not an exchange order client.

## Setup {#setup}

Install the package with `npm install coinbase-api`. Save each example with the shown filename and run it with Node.js 24. Public examples need no credentials; for authenticated examples, add the named variables to a private `.env` file excluded from Git, then use `node --env-file=.env filename.ts`. Keep account output private.

## Public prices {#market-data}

Save as `app-market-data.ts` and run `node app-market-data.ts`:

<<< @/../examples/app-market-data.ts

`getSpotPrice()` returns a `data` object. Use `getBuyPrice()` or `getSellPrice()` for the corresponding price endpoint, and `getExchangeRates()` for currency conversion data. A displayed price is not an executable order or a reserved quote.

## Authenticate wallet reads {#authentication}

Use the CDP key name and private key accepted by the App endpoints you need:

```dotenv
COINBASE_APP_API_KEY=organizations/your-organization/apiKeys/your-key
COINBASE_APP_API_SECRET="your-full-PEM-private-key-with-\n-line-breaks"
```

Retain the complete original private-key header, footer and newlines in your local value. The REST client normalizes escaped newline sequences. Grant only the required account permissions; signing a request does not grant access to every App endpoint.

Save as `app-read.ts`:

<<< @/../examples/app-read.ts

### Account balances and pagination {#account-state}

The response contains `data` (accounts) and `pagination`. Each account has its own ID and balance. Use `getAccount({ account_id })` for one account. When loading the whole account list, follow the returned pagination metadata using `getAccounts({ paginationURL })` rather than assuming the first page is complete. Use only pagination URLs returned by the trusted Coinbase response.

## Inspect transactions {#transactions}

Set `COINBASE_APP_ACCOUNT_ID` to an account ID returned above. Save as `app-transactions.ts`:

<<< @/../examples/app-transactions.ts

`getTransactions()` also returns `data` and `pagination`. For a specific unresolved transaction, call `getTransaction({ account_id, transactionId })`; the parameter is `transactionId`, not an exchange `order_id`.

Use transaction status and the account balance together when reconciling wallet activity. Keep original transaction identifiers, and do not assume that a successful HTTP response means a transfer has completed.

## Money movement {#transfers}

`sendMoney()` sends supported assets to a recipient, while `transferMoney()` moves supported assets between the user's eligible accounts. Both change account state. `depositFunds()` / `withdrawFunds()` and their commit methods have their own payment-method and confirmation requirements. Do not invoke them just to verify credentials.

Review the recipient or destination account, currency, amount, fees and permissions before sending. If a response is lost, resolve the original transaction with targeted reads before creating another transfer.

## Transport and environments {#environments}

There is no mapped App sandbox, App WebSocket feed or App WebSocket request API in this SDK. Load wallet state through REST at the workflow points that need it. If your application receives account events through another authorized integration, apply those passively and use targeted reads for gaps; exchange market streams do not cover App wallet transactions.

[App client reference](/api/classes/CBAppClient) · [Choose another API](/products)
