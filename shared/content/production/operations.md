## Observe failures without exposing credentials

Record operation names, response codes, request duration, retry counts and reconnect events. Log selected fields rather than complete request or error objects. See [Error handling](/guides/errors) for this SDK's response shapes.

## Shut down cleanly

Stop accepting new work, settle or reconcile outstanding requests, call `WebsocketClient.closeAll()`, and clear application timers. The [stream example](/guides/websockets) shows signal handlers and a bounded run.

<!--@include: ./upgrading.md-->
