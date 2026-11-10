---
title: "Coinbase WebSocket subscriptions"
description: "Subscribe to Advanced Trade ticker and heartbeat updates with automatic reconnect."
---

# WebSocket subscriptions

`WebsocketClient` manages connections, signing and resubscriptions. Choose the correct `WS_KEY_MAP` feed; channel names and payloads differ across Coinbase products.

## Stream Advanced Trade prices

Save this as `stream.ts` and run `node stream.ts` with Node.js 24:

<<< @/../examples/stream.ts

The example runs until you press Ctrl+C. `heartbeats` helps keep subscriptions active during quiet periods. The SDK's connection-health handling is separate from your application's price freshness checks.

The topic object uses **`payload`**, not `params`. For Advanced Trade, `payload.product_ids` supplies product IDs to the channel. Subscribe to `level2` instead of `ticker` when maintaining an order book; its data arrives on the `l2_data` channel. Implement the exchange's snapshot, update and sequence semantics rather than treating each update as a complete book.

## Events

| Event | Meaning |
| --- | --- |
| `open` | Initial socket open. |
| `update` | Parsed channel data, with the connection's `wsKey`. |
| `response` | Reply to a subscription or another command. |
| `exception` | SDK, exchange or listener exception. |
| `reconnect` | Connection recovery has started. |
| `reconnected` | Socket reopened after a disconnect. |
| `authenticated` | Session authentication confirmed where that protocol has a separate authentication step. |

`subscribe()` is not an awaitable server acknowledgement. Inspect `response` and `exception`, and confirm the channels you require before relying on them. Advanced Trade signs subscription requests rather than establishing the Global-style authenticated session.

## Unsubscribe and shutdown

Pass the same topic/payload and feed key to `unsubscribe()`. It removes that subscription from the recovery cache. Call `closeAll()` for intentional shutdown; do not add a competing reconnect loop.

Reconnect restores transport and cached subscriptions, not missed data. See [production recovery](/guides/production#recover-streaming-state) and [private streams](/guides/private-streams).

[WebsocketClient reference](/api/classes/WebsocketClient) · [Coinbase WebSocket documentation](https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/websocket/websocket-overview)
