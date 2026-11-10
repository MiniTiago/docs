---
title: "Coinbase SDK errors"
description: "Handle Advanced Trade REST failures, business rejections and stream errors."
---

# Errors

Distinguish transport errors, rejected API requests and business-level failures in successful HTTP responses.

## REST failures

With `parseExceptions: true` (the default), HTTP failures are thrown as objects containing `code` (HTTP status), `message`, `body`, `headers`, `requestOptions` and `requestParams`. Network errors can retain the underlying error shape; request-setup failures can be thrown as a string. Catch values are not guaranteed to be `Error` instances.

Set `parseExceptions: false` in the first constructor argument if your application needs the underlying transport error. Request-setup and network failures can still differ in shape.

The SDK redacts configured credentials from its normalized options, but request parameters, bodies and headers can still contain private data. Avoid dumping full errors into public logs or issue reports.

## Successful HTTP responses can still fail

- Advanced Trade order submission: inspect `success` and `error_response`.
- Order preview: inspect `errs` and `warning`.
- Batch cancellation: inspect each item in `results`.

## WebSocket failures

Attach an `exception` listener before subscribing. Inspect `response` for subscription acknowledgements and keep the default SDK logger. An active socket is not proof that a requested channel was accepted.

## Retry policy

Retry transient read failures with bounded backoff and jitter, respecting rate-limit responses. Correct invalid parameters or credentials rather than repeatedly retrying them. For writes, first resolve any uncertain outcome using private events and targeted REST reads.

[Production usage](/guides/production) · [Troubleshooting](/guides/troubleshooting)
