---
title: "Coinbase Advanced Trade SDK clients"
description: "Choose REST requests or streaming subscriptions for Advanced Trade."
---

# Advanced Trade clients

Use these two clients for Advanced Trade brokerage APIs. Looking for Global derivatives, Exchange, INTX, Prime, App or Commerce? [Choose your Coinbase API](/products).

<!-- #region client-list -->
| Client | Purpose |
| --- | --- |
| [`CBAdvancedTradeClient`](/api/classes/CBAdvancedTradeClient) | Advanced Trade REST: market data, accounts, orders and supported derivatives endpoints. |
| [`WebsocketClient`](/api/classes/WebsocketClient) | Advanced Trade market and user subscriptions, selected with `advTradeMarketData` or `advTradeUserData`. |
<!-- #endregion client-list -->

## REST requests

<<< @/../examples/first-call.ts

Methods return response bodies directly, not Axios response wrappers. Public market-data methods have `Public` in their name. Account and order methods require [Advanced Trade credentials](/guides/authentication).

## WebSocket subscriptions

Register listeners before calling `subscribe()`. Pass the correct Advanced Trade `WS_KEY_MAP` value and receive parsed data on `update`. See [WebSocket subscriptions](/guides/websockets) and [private account updates](/guides/private-streams).

`WebsocketClient` also supports other Coinbase products, but their channels and credentials belong to their own product guides. `WebsocketAPIClient` is for [Global derivatives](/products/global), not Advanced Trade spot order entry.

[Advanced Trade reference](/reference) · [Choose another API](/products)
