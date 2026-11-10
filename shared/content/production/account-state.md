## Keep account state up to date

Use REST to submit orders and private WebSocket subscriptions to follow what happens next. Order, fill, balance and position events update your application's account state as changes occur.

1. Connect the private streams and confirm the subscriptions before submitting orders. Load any starting state the streams do not provide, and account for events received while that data loads.
2. Submit the order through REST. Save the returned IDs and inspect the response for errors or immediate results. An acknowledgement alone does not establish the order's later state.
3. Apply matching WebSocket events to local state. Use order and fill events to track execution, and balance or position updates for the account changes your application needs. These events can arrive separately.
4. Use REST to fill a specific gap: startup data, updates missed during a disconnect, conflicting events, or an outcome that neither the response nor the stream has resolved. Once repaired, continue from WebSocket updates.

Do not query REST after every submission or poll it while the required streams are healthy and complete. A quiet stream can mean nothing has changed. Check connection and subscription health separately from account activity.

See [Account State](https://siebly.io/reference/glossary#accountstate) for the full workflow. The [private stream guide](/guides/private-streams) shows how to receive updates; the examples print events rather than maintain a complete account-state store.
