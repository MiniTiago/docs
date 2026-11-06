---
title: "Bybit SDK API reference"
description: "Public client methods, parameters and response types for bybit-api."
---

# API reference

Client methods, parameters and response types exported by `bybit-api`. The same API works in JavaScript and TypeScript.

## Clients

- [RestClientV5](/api/classes/RestClientV5)
- [WebsocketClient](/api/classes/WebsocketClient)
- [WebsocketAPIClient](/api/classes/WebsocketAPIClient)

## Common methods

| Task | Method |
| --- | --- |
| Read a Spot ticker | [`getTickers()`](/api/classes/RestClientV5#gettickers) |
| Read a Spot order book | [`getOrderbook()`](/api/classes/RestClientV5#getorderbook) |
| Subscribe to ticker updates | [`subscribeV5()`](/api/classes/WebsocketClient#subscribev5) |
| Close streaming connections | [`closeAll()`](/api/classes/WebsocketClient#closeall) |

## Account and orders

Follow [Place and cancel an order](/guides/orders) for a complete Testnet workflow. Use [Private order updates](/guides/private-streams) to receive changes over WebSocket.

Start by [verifying account access](/guides/authentication#verify-account-access) on Testnet. These methods require credentials with the relevant permissions; read the response type and [error handling](/guides/errors) before sending orders.

| Task | Method |
| --- | --- |
| Read unified-account balances | [`getWalletBalance()`](/api/classes/RestClientV5#getwalletbalance) |
| Place an order | [`submitOrder()`](/api/classes/RestClientV5#submitorder) |
| Query active/recent orders | [`getActiveOrders()`](/api/classes/RestClientV5#getactiveorders) |
| Query order history | [`getHistoricOrders()`](/api/classes/RestClientV5#gethistoricorders) |
| Cancel an order | [`cancelOrder()`](/api/classes/RestClientV5#cancelorder) |

Match each order request’s `category` to the intended product and account.

Search methods and types with **⌘K / Ctrl+K**.

[All exports](/api/) · [Bybit tutorial](https://siebly.io/sdk/bybit/javascript/tutorial) · [Upstream API documentation](https://bybit-exchange.github.io/docs/v5/intro)
