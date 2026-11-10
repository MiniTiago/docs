---
title: "Coinbase SDK API reference"
description: "Find Coinbase REST and WebSocket client methods, parameters and response types."
---

# API reference

Methods, parameters and response types exported by [`coinbase-api`](https://www.npmjs.com/package/coinbase-api). JavaScript and TypeScript share the same API.

## Advanced Trade clients

- [CBAdvancedTradeClient](/api/classes/CBAdvancedTradeClient): REST methods.
- [WebsocketClient](/api/classes/WebsocketClient): use Advanced Trade feed keys.

For other products, use their [separate reference entry points](/products).

## Advanced Trade tasks

| Task | Method |
| --- | --- |
| Public product and price | [`getPublicProduct()`](/api/classes/CBAdvancedTradeClient#getpublicproduct) |
| Public order book | [`getPublicProductBook()`](/api/classes/CBAdvancedTradeClient#getpublicproductbook) |
| Authenticated account list | [`getAccounts()`](/api/classes/CBAdvancedTradeClient#getaccounts) |
| Check key permissions | [`getApiKeyPermissions()`](/api/classes/CBAdvancedTradeClient#getapikeypermissions) |
| Preview an order | [`previewOrder()`](/api/classes/CBAdvancedTradeClient#previeworder) |
| Submit an order | [`submitOrder()`](/api/classes/CBAdvancedTradeClient#submitorder) |
| Check a specific order | [`getOrder()`](/api/classes/CBAdvancedTradeClient#getorder) |
| List orders | [`getOrders()`](/api/classes/CBAdvancedTradeClient#getorders) |
| List fills | [`getFills()`](/api/classes/CBAdvancedTradeClient#getfills) |
| Cancel orders | [`cancelOrders()`](/api/classes/CBAdvancedTradeClient#cancelorders) |

Use [Authentication](/guides/authentication), [Orders](/guides/orders) and [Private account updates](/guides/private-streams) for working context. Search methods and types with **⌘K / Ctrl+K**.

[Reference index](/api/) · [Coinbase developer documentation](https://docs.cdp.coinbase.com/)
