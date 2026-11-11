---
title: "Coinbase SDK troubleshooting"
description: "Diagnose Coinbase authentication, subscription, response and proxy issues."
---

# Troubleshooting

## Public request asks for credentials

Use `getPublicProduct()`, `getPublicProducts()` or `getPublicProductBook()` for unauthenticated Advanced Trade data. The similarly named methods without `Public` use authenticated routes.

## Authentication fails

Confirm API family, permissions, environment, key name, private-key format and clock. Advanced Trade uses CDP key credentials. For another API family, follow its [product guide](/products). Preserve PEM newlines. A signer accepting a key does not prove the target product supports its algorithm.

## WebSocket opens but no data arrives

Listen to `response` and `exception`. Check the `WS_KEY_MAP` value, exact channel and product IDs. Topic parameters belong in `payload`. Parsed data arrives on **`update`**, not the `message` event used by some other SDKs. Add `heartbeats` to Advanced Trade subscriptions and distinguish a quiet market from a rejected channel.

## Sandbox URL fails

Advanced Trade has a static REST sandbox but no WebSocket sandbox. Check [environment availability](/guides/configuration#environments) rather than assuming `useSandbox` applies everywhere.

## Order request resolves but no order appears

Inspect `success` and `error_response`, or preview `errs`. A preview never submits an order. For submitted orders, check the private stream and resolve remaining ambiguity with a targeted read. Never repeat an uncertain submission blindly.

## Proxy works for REST only

REST Axios options do not configure WebSocket transport. Set `wsOptions.agent` as well. Disable SDK `keepAlive` when supplying a custom HTTPS agent. See [Proxies](/guides/proxies).

<!--@include: @/.vitepress/shared/troubleshooting/reproduction.md-->
