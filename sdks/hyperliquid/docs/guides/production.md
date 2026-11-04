---
title: Hyperliquid SDK production usage
description: Configure request timeouts, handle uncertain order outcomes, recover WebSocket subscriptions and shut down Hyperliquid SDK clients cleanly.
---

# Production usage

| Concern | SDK behavior | Application responsibility |
| --- | --- | --- |
| HTTP requests | Requests have a timeout and are not retried automatically. | Choose a timeout and decide which failed reads to retry. |
| WebSocket connections | Unexpected disconnects trigger reconnection by default. | Observe connection events and detect gaps in application state. |
| Subscriptions | Cached subscriptions are restored after reconnection. | Reload state that may have changed during the gap. |
| WebSocket requests | Pending requests reject on connection failure; they are not replayed. | Check the outcome of a signed action before resubmitting it. |
| Order responses | A fulfilled request can contain rejected individual orders. | Inspect every entry in the result. |

## Reuse clients

Reuse a client for each network and signing configuration to retain HTTP connections, metadata caches and WebSocket subscriptions.

Set the same [network](/guides/configuration#networks) on related REST and WebSocket clients.

## Timeouts and retries

Set HTTP timeouts in the second `RestClient` argument. WebSocket request timeouts include connection setup. See [Configuration](/guides/configuration) for defaults and examples.

Retry transient read failures with a maximum attempt count, increasing delays and jitter. Correct invalid input or configuration before retrying.

Hyperliquid may process an action before the request times out. Check its outcome before resubmitting.

### Check an order after a timeout

Save the account, network and client order ID before submitting. If the response is lost, query the order by that identifier.

Set `HYPERLIQUID_ACCOUNT_ADDRESS` and `HYPERLIQUID_CLIENT_ORDER_ID` to the values used for the original order. Save the example as `order-status.mjs` and run `node order-status.mjs`. It uses Mainnet; add `testnet: true` for a Testnet order.

<<< @/../examples/order-status.ts

`unknownOid` means this query found no order. Confirm the account, network and identifier, then check order and fill history before resubmitting.

[getOrderStatus reference](/api/classes/RestClient#getorderstatus) · [Order result handling](/guides/errors#order-results)

## Rate limits

Hyperliquid applies IP-based and address-based limits, with different weights for different operations. Bound concurrent requests and polling frequency across all workers that share an IP or account. Prefer subscriptions for continuously changing market data.

Reduce request volume after rate-limit responses and delay retries. Set request budgets using [Hyperliquid's limits](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits).

## Recover after a disconnect

The SDK restores subscriptions after a disconnect. Use `reconnecting` to mark a possible data gap. After `reconnected`, reload affected state and account for updates received during recovery before using it for decisions. See [subscription recovery](/guides/websockets#reconnection) and [WebSocket errors](/guides/errors#websocket-requests-and-subscriptions).

## Logging and monitoring

Record the method, network, duration and order ID. For HTTP failures, include `message`, `status` and `code` when available. For WebSockets, track `exception`, `reconnecting` and `reconnected`.

Whole request bodies, error causes and client configuration can contain private keys or signatures. Log selected fields.

## Shut down cleanly

Stop new work and wait for in-flight requests within a shutdown deadline. `WebsocketClient.closeAll()` closes connections, rejects pending requests and cancels queued reconnects. `WebsocketAPIClient.close()` closes its underlying client.

Clear application timers and process listeners. The [subscription example](/guides/websockets#subscribe-to-mid-prices) handles Ctrl+C and `SIGTERM`.

<!--@include: @/.vitepress/shared/production/upgrading.md-->

## Further reading

- [Troubleshoot connection and request failures](/guides/troubleshooting).
- [Configure clients, networks and timeouts](/guides/configuration).
- [Follow the Hyperliquid integration tutorial on Siebly.io](https://siebly.io/sdk/hyperliquid/javascript/tutorial).
