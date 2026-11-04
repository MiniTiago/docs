---
title: "Binance SDK error handling"
description: "Interpret Binance API responses, HTTP failures and transport errors."
---

# Error handling

## HTTP and transport failures

REST requests reject on HTTP and transport failures. With the default `parseExceptions` setting, a Binance HTTP error can expose `code`, `message`, `body` and `headers`. `code` is the Binance error code, not necessarily the HTTP status.

Connection failures can have a different shape. Check fields before reading them; thrown values may not be `Error` instances.

## Keep original transport errors

Set `parseExceptions: false` in the first constructor argument to retain the Axios error and its HTTP response status.

## Log useful fields

Log the operation, symbol, HTTP status and Binance error code when available. Whole errors can include credentials or signatures in request URLs and configuration.

## Decide what to retry

Correct validation, signature and permission failures before retrying. Limit retries for reads and apply backoff. A timeout after submitting an order does not prove rejection; query the order before deciding whether to resubmit.

See [Production usage](/guides/production) and [Binance's error reference](https://developers.binance.com/docs/binance-spot-api-docs/errors).
