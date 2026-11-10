---
title: Hyperliquid SDK clients
description: Choose a Hyperliquid client for HTTP requests, streaming subscriptions or awaitable WebSocket requests.
---

# Clients

The SDK exports three clients. Each supports Mainnet and Testnet; public queries do not require a signer.

| Client | Interface | Use |
| --- | --- | --- |
| `RestClient` | HTTP requests | Query data or submit signed actions with `await`. |
| `WebsocketClient` | WebSocket subscriptions | Receive updates through event listeners. |
| `WebsocketAPIClient` | WebSocket requests | Call the REST client's methods over a persistent connection. |

## RestClient

`RestClient` sends HTTP requests and returns promises.

<<< @/../examples/first-call.ts

Market data methods work without credentials. Account queries need an account address; signed actions need a private key or signer. See [Authentication](/guides/authentication).

[RestClient reference](/api/classes/RestClient) · [Market data examples](/guides/market-data)

## WebsocketClient

Use `WebsocketClient` for subscriptions. Register `message` and `exception` listeners before calling `subscribe()`. The client opens the required connection automatically.

`subscribe()` resolves after sending locally. Server acknowledgements arrive on `response`. See the [subscription example](/guides/websockets) for event handling and cleanup.

Call `unsubscribe()` to remove a topic while keeping the connection, or `closeAll()` to close all connections. Removing an event listener does not remove the subscription.

[WebsocketClient reference](/api/classes/WebsocketClient) · [Subscription types](/api/type-aliases/WebsocketSubscription)

## WebsocketAPIClient

`WebsocketAPIClient` extends `RestClient` and sends the same methods through Hyperliquid's WebSocket POST protocol.

<!--@include: @/.vitepress/shared/clients/awaitable-websocket.md-->

<<< @/../examples/ws-request.ts

The first request opens the connection. Close the client when finished. For streaming updates, use `WebsocketClient` subscriptions instead.

[WebsocketAPIClient reference](/api/classes/WebsocketAPIClient) · [Client configuration](/guides/configuration)
