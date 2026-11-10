---
title: "Binance WebSocket subscriptions"
description: "Subscribe to Binance ticker updates, handle connection events and close the client."
---

# Public streams (WebSocket) {#websocket-subscriptions}

Subscribe to BTCUSDT Spot ticker updates. This public stream requires no API key.

## Subscribe to a ticker

Save this as `stream.ts` in a TypeScript project. It prints updates for 30 seconds and closes on completion, Ctrl+C or `SIGTERM`.

<<< @/../examples/stream.ts

## Optional: readable fields with the SDK beautifier

For descriptive field names and parsed numeric values, enable the SDK beautifier. In the example above, replace the client constructor and raw `message` listener with:

```ts
const ws = new WebsocketClient({ beautify: true });

ws.on('formattedMessage', (message) => {
  console.log(message);
});
```

Keep the subscription and cleanup code unchanged. A ticker's `s` and `c` fields become `symbol` and `currentClose`. Raw events remain available on `message` if you need the original decimal strings. The [private-stream example](/guides/private-streams#optional-readable-fields-with-the-sdk-beautifier) shows typed handling of formatted order updates.

## Subscription results and messages

Await the subscription promise and catch failures. Market data arrives on `message`; `response` carries subscription replies.

## Recover after a disconnect

The client reconnects and restores subscriptions. Use `reconnecting`, `reconnected` and `exception` to track connection changes. See [stream recovery](/guides/production#recover-streaming-state) for rebuilding application state after a gap.

## Shut down

Call `closeAll()` to close this client's connections. Clear application timers and stop new work during shutdown.

[Production usage](/guides/production) · [WebsocketClient reference](/api/classes/WebsocketClient)
