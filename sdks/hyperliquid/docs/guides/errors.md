---
title: Hyperliquid SDK error handling
description: Handle Hyperliquid HTTP and WebSocket errors, inspect status and response fields, and check individual order results.
---

# Error handling

Handle rejected request promises with `try` / `catch`. Streaming clients also report failures through the `exception` event.

| Failure | Where to handle it |
| --- | --- |
| An HTTP request or top-level API rejection | Catch the request promise. |
| A WebSocket request failure | Catch the request promise; observe connection events as well. |
| A subscription or connection failure | Catch `subscribe()` failures and listen for `exception`. |
| An individual rejected order | Inspect each entry in the successful action response. |

## HTTP requests

`RestClient` throws `HyperliquidApiError` for HTTP transport failures and top-level Hyperliquid responses with `status: 'err'`.

<<< @/../examples/request-errors.ts

| Property | Meaning |
| --- | --- |
| `message` | The error message from the API or HTTP client. |
| `status` | HTTP status, if a response was received. An API error can still have HTTP status `200`. |
| `code` | Transport error code, when supplied by the HTTP client. |
| `response` | Response body, when available. |
| `cause` | Original error, when available. |

Configuration and input errors can use other types, so keep a fallback in the error handler. HTTP requests are not retried automatically.

[HyperliquidApiError reference](/api/classes/HyperliquidApiError)

## WebSocket requests and subscriptions

`HyperliquidWebSocketError` represents transport and protocol failures, including connection errors, request timeouts and error responses to WebSocket POST requests. An Exchange action response with `status: 'err'` instead rejects with `HyperliquidApiError`. Catch both types when using `WebsocketAPIClient`, and register an `exception` listener for connection and protocol events.

Handle rejected `subscribe()` promises and subsequent `exception` events. The server acknowledges subscriptions through `response`. The [subscription example](/guides/websockets#subscribe-to-mid-prices) shows the handlers.

Reconnection restores subscriptions without replaying requests. After a timeout or disconnect during an action, [check its outcome before resubmitting](/guides/production#check-an-order-after-a-timeout).

[HyperliquidWebSocketError reference](/api/classes/HyperliquidWebSocketError) · [WebsocketExceptionEvent](/api/interfaces/WebsocketExceptionEvent)

## Order results

A successful request can contain rejected individual orders. Inspect each entry in `response.data.statuses` returned by `submitOrder()`: an entry can be `resting`, `filled` or `error`.

[`submitOrder()`](/api/classes/RestClient#submitorder) · [`OrderResponseData`](/api/interfaces/OrderResponseData)
