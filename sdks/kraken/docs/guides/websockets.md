---
title: "Kraken WebSocket subscriptions"
description: "Subscribe to Kraken Spot ticker updates with automatic reconnects and default SDK logging."
---

# Public streams (WebSocket) {#websocket-subscriptions}

`WebsocketClient` manages public and private subscriptions for Spot and Futures. This example subscribes to the public Spot v2 ticker for `BTC/USD`, without credentials.

## Subscribe to a ticker

Save this as `stream.ts` in a TypeScript project and run `node stream.ts` with Node.js 24. It logs messages for 30 seconds, then closes its connections. Ctrl+C and `SIGTERM` also close the client.

<<< @/../examples/stream.ts

## Messages and acknowledgements

Register listeners before calling `subscribe()`. It requests the subscription but does not return a promise confirming acceptance. Successful subscription replies arrive on `response`; rejected replies arrive on `exception`. Stream data arrives on `message`.

The example logs every message rather than dropping unrecognised events. In an application, route messages by channel and retain a catch-all branch for diagnostics.

## Reconnects and shutdown

The SDK reconnects and restores subscriptions automatically. `reconnecting` is a status event, not a reason to terminate the process. `reconnected` indicates the connection has recovered; reconcile any application state that may have missed updates.

The timer only limits this demonstration. Long-running services can omit it and call `closeAll()` when intentionally stopping the client. See [stream recovery](/guides/production#recover-streaming-state).

[Private account updates](/guides/private-streams) · [WebsocketClient reference](/api/classes/WebsocketClient)
