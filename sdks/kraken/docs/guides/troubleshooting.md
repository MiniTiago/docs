---
title: "Kraken SDK troubleshooting"
description: "Diagnose Kraken package selection, symbols, authentication, environment and WebSocket problems."
---

# Troubleshooting

## Wrong package or missing clients

Install [`@siebly/kraken-api`](https://www.npmjs.com/package/@siebly/kraken-api). The unscoped `kraken-api` package is a different library. Import public clients from the package root, not internal file paths.

## Testnet is unavailable

Spot has no public testnet. Kraken retired its Futures demo on 14 July 2026, and `testnet: true` throws in the current SDK. Use public reads or [Spot order validation](/guides/orders) for non-trading development; do not treat a beta API endpoint as simulated trading.

## Invalid symbol or unexpected response key

Spot REST aliases and WebSocket v2 symbols differ. The examples use `XBTUSD` for REST and `BTC/USD` for WebSocket v2. REST may return a canonical pair key such as `XXBTZUSD`. Use returned keys or instrument metadata instead of assuming the input alias is the result key. Futures uses contract symbols from its own market-data API.

## Authentication or nonce errors

Use credentials for the correct product, check permissions and IP restrictions, and provide the original base64 Spot API secret. Coordinate processes sharing a key to prevent out-of-order private request nonces. See [Authentication](/guides/authentication).

## No private stream updates

Check the key's WebSocket access and channel permissions. Register listeners for `response` and `exception` before subscribing. A subscription request is not confirmation of acceptance. The SDK manages the Spot token automatically.

## No ticker messages

Check subscription replies and use the correct connection key and symbol format. Ticker updates depend on market activity and channel options. Log unmatched messages while diagnosing the connection.

## An order request timed out

Do not assume it failed. Reconcile orders and executions before another submission; see [Production usage](/guides/production#resolve-uncertain-order-outcomes).

[Error handling](/guides/errors) · [SDK issues](https://github.com/sieblyio/kraken-api/issues)
