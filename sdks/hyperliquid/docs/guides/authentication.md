---
title: Hyperliquid SDK authentication and account addresses
description: Query Hyperliquid accounts by address and configure private keys, API wallets, vaults or custom signers for signed actions.
---

# Authentication

Public market data and account queries do not require a signature. Exchange actions, such as placing or cancelling an order, require a private key or signer.

## Read account state

Set `accountAddress` to query an account without configuring a signer. This example reads its perpetual positions.

<<< @/../examples/account-state.ts

Set `HYPERLIQUID_ACCOUNT_ADDRESS` before running the example. Perpetual positions are in `assetPositions`. For unified accounts or portfolio margin, [`getSpotBalances()`](/api/classes/RestClient#getspotbalances) returns balances across Spot and perps.

Account methods resolve addresses in this order: request `user`, `vaultAddress`, `accountAddress`, then the configured signer.

[getPerpAccountSummary](/api/classes/RestClient#getperpaccountsummary) · [AccountRequest](/api/interfaces/AccountRequest)

## Configure a private key

Pass `privateKey` and the managed account address to `RestClient`. This example configures Testnet.

<<< @/../examples/authenticated-client.ts

Keep the private key in a server-side environment variable, outside source files and browser bundles.

## API wallets and vaults

An API wallet signs for another account. Set `accountAddress` to the managed account so queries return its balances and positions.

`vaultAddress` selects a vault or subaccount for supported actions and takes precedence over `accountAddress` for account queries. The signer must be authorized for the requested action. See the [Hyperliquid tutorial](https://siebly.io/sdk/hyperliquid/javascript/tutorial) for the account and API wallet setup workflow.

## Custom signers

Pass `signer` instead of `privateKey` to supply a [`HyperliquidSigner`](/api/interfaces/HyperliquidSigner). The interface requires `signTypedData()` and supports an `address` or `getAddress()` for address resolution. An ethers Wallet can satisfy this interface.

`WebsocketAPIClient` accepts the same signing options. `WebsocketClient` subscriptions use account addresses and do not need a private key.

[RestClientOptions](/api/interfaces/RestClientOptions) · [WebsocketAPIClientOptions](/api/type-aliases/WebsocketAPIClientOptions) · [Order results and errors](/guides/errors#order-results)

## Next steps

[Place and cancel a Testnet order](/guides/orders), or [subscribe to account order updates](/guides/private-streams).
