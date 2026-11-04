---
title: Hyperliquid SDK authentication and account addresses
description: Read Hyperliquid account state without a private key and configure a private key or custom signer for signed actions. Understand API wallets and account addresses.
---

# Authentication

Public market data and account queries do not require a signature. Exchange actions, such as placing or cancelling an order, require a private key or signer.

## Read account state

Set `accountAddress` to query an account without configuring a signer. This example reads its perpetual positions.

<<< @/../examples/account-state.ts

Set `HYPERLIQUID_ACCOUNT_ADDRESS` to the account you want to query before running the example. `assetPositions` contains the account's perpetual positions. For unified accounts or portfolio margin, see [`getSpotBalances()`](/api/classes/RestClient#getspotbalances) for balances across spot and perps.

You can also pass a `user` address to an account method. Address resolution checks the request's `user` first, then `vaultAddress`, then `accountAddress`. If none is set, the SDK attempts to resolve the account from the configured signer.

[getPerpAccountSummary](/api/classes/RestClient#getperpaccountsummary) · [AccountRequest](/api/interfaces/AccountRequest)

## Configure a private key

On a server, pass `privateKey` and the account being managed to `RestClient`. This example configures a Testnet client; it does not submit an action.

<<< @/../examples/authenticated-client.ts

Keep the key in a server-side environment variable. Do not include it in source files or environment variables exposed to browser bundles.

## API wallets and vaults

An API wallet signs actions for an account. Its signing address can differ from the account address whose balances and positions you want to read. Set `accountAddress` to that account, rather than the API wallet's address.

`vaultAddress` selects a vault or subaccount for supported actions and takes precedence over `accountAddress` for account queries. The signer must be authorized for the requested action. See the [Hyperliquid tutorial](https://siebly.io/sdk/hyperliquid/javascript/tutorial) for the account and API wallet setup workflow.

## Custom signers

Pass `signer` instead of `privateKey` to supply a [`HyperliquidSigner`](/api/interfaces/HyperliquidSigner). The interface requires `signTypedData()` and supports an `address` or `getAddress()` for address resolution. An ethers Wallet can satisfy this interface.

`WebsocketAPIClient` accepts the same signing options. `WebsocketClient` subscriptions use account addresses and do not need a private key.

[RestClientOptions](/api/interfaces/RestClientOptions) · [WebsocketAPIClientOptions](/api/type-aliases/WebsocketAPIClientOptions) · [Order results and errors](/guides/errors#order-results)
