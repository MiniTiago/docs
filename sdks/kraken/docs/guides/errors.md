---
title: "Kraken SDK error handling"
description: "Handle Kraken API errors, HTTP failures and uncertain request outcomes."
---

# Error handling

## API and transport failures

Spot REST responses include an `error` array and `result`. The SDK rejects a response with a nonempty error array by default. Futures responses with `result: 'error'` also reject. Handle both with `catch`; there is no extra response-checking helper to enable.

With default exception parsing, a response error includes the HTTP `code`, `message`, exchange `body`, `headers` and request context. Spot exchange errors are in `body.error`; Futures errors are in the Futures response body. HTTP success alone does not mean the exchange operation succeeded.

Network failures can have a different shape, and thrown values need not be `Error` instances. The examples log the original error so useful diagnostics are not replaced with a generic message.

## Logs in deployed applications

Keep `KRAKENTRACE` unset for authenticated requests. Before forwarding logs to a shared service, select useful operation, status and exchange-error fields and redact credentials and private account data. `parseExceptions: false` preserves the original transport error, which can include request configuration.

## Retry decisions

Correct invalid parameters, signatures and permissions before retrying. Apply bounded backoff to transient read failures. If an order submission times out, check matching private execution events. Use REST to recover missing state only if the outcome remains unclear; do not automatically submit again. See [order recovery](/guides/production#resolve-uncertain-order-outcomes).

WebSocket subscription failures arrive on `exception`. Use [subscription responses](/guides/websockets#messages-and-acknowledgements) and stream data for their distinct purposes.

[Production usage](/guides/production) · [Kraken Spot errors](https://docs.kraken.com/api/docs/guides/spot-errors/)
