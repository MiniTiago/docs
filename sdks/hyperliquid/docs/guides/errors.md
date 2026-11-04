---
title: Hyperliquid SDK error handling
description: Handle HyperliquidApiError, WebSocket failures and per-order rejections. Inspect request status and distinguish connection recovery from retrying an action.
---

# Error handling

Handle rejected request promises with `try` / `catch`. Streaming clients also report failures through the `exception` event.

| Failure | Where to handle it |
| --- | --- |
| An HTTP request or top-level API rejection | Catch the request promise. |
| A WebSocket request failure | Catch the request promise; observe connection events as well. |
| A subscription or connection failure | Catch `subscribe()` failures and listen for `exception`. |
| An individual rejected order | Inspect each entry in the successful action response. |

For symptom-based fixes, use [Troubleshooting](/guides/troubleshooting). For retry decisions and uncertain outcomes, use [Production usage](/guides/production#timeouts-and-retries).

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

Configuration and local input errors can use other error types, so retain a fallback for an unknown error. The SDK does not automatically retry HTTP requests.

[HyperliquidApiError reference](/api/classes/HyperliquidApiError)

## WebSocket requests and subscriptions

`HyperliquidWebSocketError` represents transport and protocol failures, including connection errors, request timeouts and error responses to WebSocket POST requests. An Exchange action response with `status: 'err'` instead rejects with `HyperliquidApiError`. Catch both types when using `WebsocketAPIClient`, and register an `exception` listener for connection and protocol events.

For subscriptions, handle both a rejected `subscribe()` promise and subsequent `exception` events. A resolved subscription promise confirms local sending, not the server's acceptance. The [subscription example](/guides/websockets#subscribe-to-mid-prices) shows both handlers and connection cleanup.

Reconnection restores cached subscriptions. It does not replay failed requests or establish that a previously submitted action was rejected. Check the relevant account or order state before deciding whether to resubmit an action after a timeout or disconnect.

[HyperliquidWebSocketError reference](/api/classes/HyperliquidWebSocketError) · [WebsocketExceptionEvent](/api/interfaces/WebsocketExceptionEvent)

## Order results

A successful request can contain rejected individual orders. Inspect each entry in `response.data.statuses` returned by `submitOrder()`: an entry can be `resting`, `filled` or `error`.

Do not treat a fulfilled promise as confirmation that every order was accepted. See [`submitOrder()`](/api/classes/RestClient#submitorder) and [`OrderResponseData`](/api/interfaces/OrderResponseData) for the complete response type.
