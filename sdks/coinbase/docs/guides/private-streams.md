---
title: "Coinbase private account updates"
description: "Observe Advanced Trade user order updates and recover passive account state."
---

# Private account updates

Use the Advanced Trade `user` channel to observe order changes without making trading requests. It reports user orders and their execution state; do not assume it is a complete ledger of every balance or position change.

## Subscribe to user orders

Configure [Advanced Trade credentials](/guides/authentication), save this as `private-stream.ts`, then run `node --env-file=.env private-stream.ts` with Node.js 24:

<<< @/../examples/private-stream.ts

The example runs until you stop it. Omitting product IDs requests user updates across available products. The SDK signs private subscription messages automatically. No manual JWT refresh loop is needed for this feed.

## Apply account changes passively

The channel sends an initial order snapshot followed by updates. Initial open orders may arrive in batches; do not mark the snapshot complete after the first message. Follow the [user channel schema](https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/websocket/websocket-channels) for batching, order status and sequence fields.

Maintain local order state keyed by order ID and account context. Use status and cumulative filled quantities to update execution state without counting the same fill twice. An order acknowledgement is not a fill, and a subscription reply is not an order acknowledgement.

Load account balances and any positions or order history the stream does not supply through REST. Apply stream events received during that load. For account fields this feed does not cover, refresh at an explicit workflow boundary or to repair a known gap. Do not claim a complete balance or position store from the `user` channel alone.

Once established, let events drive the state they cover. Do not query REST after every order or add a polling loop to check for fills. See [Account State](https://siebly.io/reference/glossary#accountstate).

## Recover after a gap

On `reconnect`, mark affected state stale. On `reconnected`, confirm subscription recovery and process fresh snapshots; use `getOrders()`, `getFills()` and `getAccounts()` to repair missing state where needed. Follow pagination and account for events arriving during those reads. Resume dependent decisions only when their required state is current.

These examples print events for inspection; they do not implement a complete account-state database. Protect private event logs as account data.

[Production usage](/guides/production) · [WebsocketClient reference](/api/classes/WebsocketClient)
