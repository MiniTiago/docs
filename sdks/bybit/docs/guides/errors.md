---
title: "Bybit SDK error handling"
description: "Interpret Bybit API responses, HTTP failures and transport errors."
---

# Error handling

## API errors in successful HTTP responses

By default, REST requests resolve even when Bybit returns a nonzero `retCode`. Check `retCode === 0` before reading `result`.

Set `throwExceptions: true` in the first constructor argument to reject those responses instead. Handle them in `catch`; thrown values may not be `Error` instances.

## HTTP and transport failures

HTTP failures reject the request. With the default exception parsing, an HTTP error can contain `code` (the HTTP status), `message`, `body` and `headers`. Read Bybit's exchange code from `body.retCode` in this case. A timeout or connection failure may have a different shape.

`parse_exceptions: false` retains the original transport error. This is separate from `throwExceptions`, which controls Bybit response codes.

## Log useful fields

Log the operation, category, symbol, HTTP status and exchange error code. Whole errors and `requestOptions` can include credentials from the client configuration.

## Decide what to retry

Fix invalid parameters and permissions before retrying. Use bounded backoff for retryable read failures. A timeout on a state-changing request leaves the outcome uncertain; check the order before submitting another request.

See [Production usage](/guides/production) and the [Bybit error-code reference](https://bybit-exchange.github.io/docs/v5/error).
