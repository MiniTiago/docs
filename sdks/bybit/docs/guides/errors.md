---
title: "Bybit SDK error handling"
description: "Interpret Bybit API responses, HTTP failures and transport errors."
---

# Error handling

## API errors in successful HTTP responses

By default, a Bybit response with a nonzero `retCode` is returned to the caller. A resolved promise alone does not establish success. Check `retCode` before reading `result`, as the Quickstart does.

You can enable `throwExceptions: true` in the first constructor argument to reject these responses. This changes control flow; retain a `catch` handler and do not assume every thrown value is an `Error` instance.

## HTTP and transport failures

HTTP failures reject the request. With the default exception parsing, an HTTP error can contain `code` (the HTTP status), `message`, `body` and `headers`. Read Bybit's exchange code from `body.retCode` in this case. A timeout or connection failure may have a different shape.

`parse_exceptions: false` retains the original transport error. This is separate from `throwExceptions`, which controls Bybit response codes.

## Log useful fields

Log the operation name, market category, symbol, HTTP status and exchange error code. Avoid logging the complete error or `requestOptions`: the Bybit parser includes client options, which may contain credentials. Keep API keys, signatures and account data out of routine logs.

## Decide what to retry

Fix invalid parameters and permissions before retrying. Use bounded backoff for retryable read failures. A timeout on a state-changing request leaves the outcome uncertain; check the order before submitting another request.

See [Production usage](/guides/production) and the [Bybit error-code reference](https://bybit-exchange.github.io/docs/v5/error).
