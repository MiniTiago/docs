---
title: "Binance SDK error handling"
description: "Interpret Binance API responses, HTTP failures and transport errors."
---

# Error handling

## HTTP and transport failures

REST requests reject on HTTP and transport failures. With the default `parseExceptions` setting, a Binance HTTP error can expose `code`, `message`, `body` and `headers`. `code` is the Binance error code, not necessarily the HTTP status.

A connection failure can have a different shape, and thrown values are not always `Error` instances. Avoid assuming `error.response.data` exists for every failure.

## Keep original transport errors

Set `parseExceptions: false` in the first constructor argument when your application needs the original Axios error, including its HTTP response status. This setting uses camelCase in the Binance SDK.

## Log useful fields

Log the operation, symbol, HTTP status when available, and Binance error code. Do not serialize the whole error: request URLs and transport configuration can contain signatures or credentials even when selected fields have been redacted.

## Decide what to retry

Correct validation, signature and permission failures before retrying. Limit retries for reads and apply backoff. A timeout after submitting an order does not prove rejection; query the order before deciding whether to resubmit.

See [Production usage](/guides/production) and [Binance's error reference](https://developers.binance.com/docs/binance-spot-api-docs/errors).
