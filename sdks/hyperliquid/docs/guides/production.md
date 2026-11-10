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

<!--@include: @/.vitepress/shared/production/account-state.md-->

## Reuse clients

Reuse a client for each network and signing configuration to retain HTTP connections, metadata caches and WebSocket subscriptions.

Set the same [network](/guides/configuration#networks) on related REST and WebSocket clients.

## Timeouts and retries

Set HTTP timeouts in the second `RestClient` argument. WebSocket request timeouts include connection setup. See [Configuration](/guides/configuration) for defaults and examples.

Retry transient read failures with a maximum attempt count, increasing delays and jitter. Correct invalid input or configuration before retrying.

Hyperliquid may process an action before the request times out. Check its outcome before resubmitting.

### Check an order after a timeout

Save the numeric order ID returned by the exchange along with the account and network. Use matching `orderUpdates` and `userFills` events to resolve the outcome first. If neither the response nor the stream settles it, use the one-shot REST query below. If no ID is available, use open orders, order history and fills to resolve the request before resubmitting.

Set `HYPERLIQUID_ACCOUNT_ADDRESS` and `HYPERLIQUID_ORDER_ID` to the account and numeric ID of the original order. Save the example as `order-status.mts` and run `node --env-file=.env order-status.mts` with Node.js 24. It uses Mainnet; add `testnet: true` for a Testnet order.

<<< @/../examples/order-status.ts

`unknownOid` means this query found no order. Confirm the account, network and identifier, then check order and fill history before resubmitting.

[getOrderStatus reference](/api/classes/RestClient#getorderstatus) · [Order result handling](/guides/errors#order-results)

## Rate limits

Hyperliquid applies IP-based and address-based limits, with different weights for different operations. Limit concurrent requests across workers that share an IP or account. Use WebSocket subscriptions for ongoing market and account updates. Reserve REST reads for initial data, explicit lookups and recovery.

Reduce request volume after rate-limit responses and delay retries. Set request budgets using [Hyperliquid's limits](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits).

## Recover after a disconnect

The SDK reconnects and restores cached subscriptions automatically. `reconnecting` signals that connection recovery is starting; mark the affected account state as stale. `reconnected` means the socket has reopened and the SDK has sent its resubscription requests. It does not wait for subscription acknowledgements or recover missed account state.

Use `reconnected` to trigger REST reconciliation of missed orders, fills, balances and positions. Confirm the required subscriptions, combine their snapshots with REST data, and account for updates received during recovery. Then reconcile open orders with the current position before making follow-up changes; do not blindly recreate orders. Resume dependent actions once their required state is current. See [subscription recovery](/guides/websockets#reconnection) and [WebSocket errors](/guides/errors#websocket-requests-and-subscriptions).

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
