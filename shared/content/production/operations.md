## Logging {#observe-failures-without-exposing-credentials}

Record operation names, response codes, duration, retries and reconnects. Select fields using the SDK's [error format](/guides/errors); whole request and error objects can contain credentials.

## Shut down cleanly

Stop new work, settle or reconcile outstanding requests, call `WebsocketClient.closeAll()` and clear application timers. The [stream example](/guides/websockets) includes shutdown handlers.

<!--@include: ./upgrading.md-->
