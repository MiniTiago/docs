---
title: Hyperliquid SDK clients
description: Compare RestClient, WebsocketClient and WebsocketAPIClient. Initialize HTTP and WebSocket clients and manage their connection lifecycle.
---

# Clients

The SDK exports three clients. Each supports Mainnet and Testnet; public queries do not require a signer.

| Client | Interface | Use |
| --- | --- | --- |
| `RestClient` | HTTP requests | Query data or submit signed actions with `await`. |
| `WebsocketClient` | WebSocket subscriptions | Receive updates through event listeners. |
| `WebsocketAPIClient` | WebSocket requests | Call the REST client's methods over a persistent connection. |

## RestClient

Use `RestClient` for individual requests. Construct the client, call a method and await its result.

<<< @/../examples/first-call.ts

Market data methods work without credentials. Account queries need an account address; signed actions need a private key or signer. See [Authentication](/guides/authentication).

[RestClient reference](/api/classes/RestClient) · [Market data examples](/guides/market-data)

## WebsocketClient

Use `WebsocketClient` for subscriptions. Register `message` and `exception` listeners before calling `subscribe()`. The client opens the required connection automatically.

The [WebSocket subscriptions guide](/guides/websockets) includes a complete example with event handling and cleanup. `subscribe()` resolves when the subscription has been sent locally. Server acknowledgements arrive through the `response` event.

Call `unsubscribe()` to remove a topic while keeping the connection, or `closeAll()` to close all connections. Removing an event listener does not remove the subscription.

[WebsocketClient reference](/api/classes/WebsocketClient) · [Subscription types](/api/type-aliases/WebsocketSubscription)

## WebsocketAPIClient

`WebsocketAPIClient` extends `RestClient` and sends its requests through Hyperliquid's WebSocket POST protocol. Its methods return promises, so calling code uses `await` in the same way as HTTP requests.

<<< @/../examples/ws-request.ts

The first request opens the connection. Close the client when finished. For streaming updates, use `WebsocketClient` subscriptions instead.

[WebsocketAPIClient reference](/api/classes/WebsocketAPIClient) · [Client configuration](/guides/configuration)
