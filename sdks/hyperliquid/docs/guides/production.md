---
title: Hyperliquid SDK production usage
description: Configure request timeouts, handle uncertain order outcomes, recover WebSocket subscriptions and shut down Hyperliquid SDK clients cleanly.
---

# Production usage

Long-running applications need to handle request failures, connection recovery and shutdown. Start with the behavior below, then set a retry and recovery policy for your application.

| Concern | SDK behavior | Application responsibility |
| --- | --- | --- |
| HTTP requests | Requests have a timeout and are not retried automatically. | Choose a timeout and decide which failed reads to retry. |
| WebSocket connections | Unexpected disconnects trigger reconnection by default. | Observe connection events and detect gaps in application state. |
| Subscriptions | Cached subscriptions are restored after reconnection. | Reload state that may have changed during the gap. |
| WebSocket requests | Pending requests reject on connection failure; they are not replayed. | Check the outcome of a signed action before resubmitting it. |
| Order responses | A fulfilled request can contain rejected individual orders. | Inspect every entry in the result. |

## Reuse clients

Keep a client for each network and signing configuration your application uses. Reusing it preserves HTTP connection reuse, metadata caches and WebSocket subscriptions. Avoid constructing a new WebSocket client for every operation.

Set Mainnet or Testnet explicitly when creating related clients. A subscription on one network cannot confirm an action on another. See [network configuration](/guides/configuration#networks).

## Timeouts and retries

Configure HTTP timeouts through the second `RestClient` argument. For WebSocket requests, distinguish the connection timeout from the request timeout, which includes connection setup. The [Configuration guide](/guides/configuration) lists defaults and examples.

For read-only queries, use a bounded retry policy for transient failures: limit attempts, increase the delay between attempts and add jitter when multiple workers retry. Do not retry invalid input or configuration errors without correcting them.

A timeout after submitting an action leaves its outcome uncertain. The exchange may have processed the action before the connection failed. Reconnection does not resolve that uncertainty.

### Check an order after a timeout

Record the account, network and any client order ID before submitting an order. If the response is lost, query the order by that identifier before deciding what to do next. This example only reads order status; it does not place or retry an order.

Set `HYPERLIQUID_ACCOUNT_ADDRESS` and `HYPERLIQUID_CLIENT_ORDER_ID` to the values used for the original order. Save the example as `order-status.mjs` and run `node order-status.mjs`. It uses Mainnet; add `testnet: true` for a Testnet order.

<<< @/../examples/order-status.ts

`unknownOid` means the query did not find the order. Confirm the account, network and identifier, and reconcile relevant order and fill history before deciding whether to submit another action. Treat this as an investigation step, not a general retry rule.

[getOrderStatus reference](/api/classes/RestClient#getorderstatus) · [Order result handling](/guides/errors#order-results)

## Rate limits

Hyperliquid applies IP-based and address-based limits, with different weights for different operations. Bound concurrent requests and polling frequency across all workers that share an IP or account. Prefer subscriptions for continuously changing market data.

If requests are rate limited, reduce the request rate and allow time before retrying eligible reads. Use the [current Hyperliquid rate limits](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits) when setting a budget; the limits are maintained by the exchange.

## Recover after a disconnect

Register lifecycle and error listeners before subscribing. Use `reconnecting` to mark affected data as potentially stale. After `reconnected`, reload the state your application depends on and account for updates that arrive during recovery before resuming decisions based on that state.

The SDK restores subscriptions, but it does not reconstruct everything that happened while disconnected. Recovery depends on the channel and your application's state model. See [subscription recovery](/guides/websockets#reconnection) and [WebSocket errors](/guides/errors#websocket-requests-and-subscriptions).

## Logging and monitoring

Record the method, network, elapsed time and any order identifier needed to investigate a request. For HTTP failures, record the available `message`, `status` and `code`. For WebSockets, track `exception`, `reconnecting` and `reconnected` events.

Log only the fields you need. Whole request bodies, error causes and client configuration can include sensitive values. Keep private keys and signing material out of logs.

## Shut down cleanly

Stop producing new work, wait for in-flight work to finish within your application's shutdown deadline, then close WebSocket clients. `WebsocketClient.closeAll()` closes connections, rejects pending requests and cancels queued reconnects. `WebsocketAPIClient.close()` closes its underlying WebSocket client.

Clear application timers and remove process listeners as well. The [subscription example](/guides/websockets#subscribe-to-mid-prices) handles both Ctrl+C and `SIGTERM`, so the same cleanup runs during a process shutdown.

<!--@include: @/.vitepress/shared/production/upgrading.md-->

## Further reading

- [Troubleshoot connection and request failures](/guides/troubleshooting).
- [Configure clients, networks and timeouts](/guides/configuration).
- [Follow the Hyperliquid integration tutorial on Siebly.io](https://siebly.io/sdk/hyperliquid/javascript/tutorial).
