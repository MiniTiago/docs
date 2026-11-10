---
title: "Kraken SDK troubleshooting"
description: "Diagnose Kraken package selection, symbols, authentication, environment and WebSocket problems."
---

# Troubleshooting

## Wrong package or missing clients

Install [`@siebly/kraken-api`](https://www.npmjs.com/package/@siebly/kraken-api). The unscoped `kraken-api` package is a different library. Import public clients from the package root, not internal file paths.

## Browser REST and CORS

In `@siebly/kraken-api@1.1.10`, a default `SpotClient` adds `UserAgent` and `locale` request headers. Chrome sends an OPTIONS preflight before the public ticker GET. Kraken returns 404 without the required CORS response headers, so Axios reports `ERR_NETWORK` even though public WebSocket updates work. An `events` alias fixes bundling, not this network failure.

The [Vite](/environments/vite) and [React](/environments/react) public-price examples use the SDK's second constructor argument, `AxiosRequestConfig`, with `transformRequest` to remove just those headers before the public GET. Passing `headers` alone does not work in this version because the SDK overwrites that option. The transform is deliberately limited to GET requests and replaces Axios's usual request-body transform. Do not reuse it for POST requests or authenticated calls.

This setup was checked with the published 1.1.10 package in Chrome using a public Spot ticker and WebSocket subscription. It does not establish support for every REST endpoint, browser or region. Kraken must still allow the browser's origin; never disable browser security or use `no-cors`, which prevents reading the response.

For a server-side path, use the [Next.js API route](/environments/next): it constructs an ordinary `SpotClient` on the Node.js server and exposes the public price at `/api/price`. A browser application can request that same-origin route instead of calling Kraken REST directly. In production, expose only the operations your app needs, with suitable validation, rate limits and authentication. Keep API credentials on the server. Do not create an unrestricted forwarding proxy.

## Testnet is unavailable

Spot has no public testnet. Kraken retired its Futures demo on 14 July 2026, and `testnet: true` throws in the current SDK. Use public reads or [Spot order validation](/guides/orders) for non-trading development; do not treat a beta API endpoint as simulated trading.

## Invalid symbol or unexpected response key

Spot REST aliases and WebSocket v2 symbols differ. The examples use `XBTUSD` for REST and `BTC/USD` for WebSocket v2. REST may return a canonical pair key such as `XXBTZUSD`. Use returned keys or instrument metadata instead of assuming the input alias is the result key. Futures uses contract symbols from its own market-data API.

## Authentication or nonce errors

Use credentials for the correct product, check permissions and IP restrictions, and provide the original base64 Spot API secret. Coordinate processes sharing a key to prevent out-of-order private request nonces. See [Authentication](/guides/authentication).

## No private stream updates

Check the key's WebSocket access and channel permissions. Register listeners for `response` and `exception` before subscribing. A subscription request is not confirmation of acceptance. The SDK manages the Spot token automatically. See the [private account updates example](/guides/private-streams#observe-spot-executions).

## No ticker messages

Check subscription replies and use the correct connection key and symbol format shown in the [ticker subscription example](/guides/websockets#subscribe-to-a-ticker). Ticker updates depend on market activity and channel options. Log unmatched messages while diagnosing the connection.

## An order request timed out

Do not assume it failed. Reconcile orders and executions before another submission; see [Production usage](/guides/production#resolve-uncertain-order-outcomes).

[Error handling](/guides/errors) · [SDK issues](https://github.com/sieblyio/kraken-api/issues)
