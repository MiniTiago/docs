---
title: "Binance SDK troubleshooting"
description: "Diagnose Binance installation, authentication, response and WebSocket problems."
---

# Troubleshooting

Start with the symptom, then check the request's market and environment. Reproduce problems with a public request where possible.

## Common symptoms

| Symptom | What to check |
| --- | --- |
| Import or missing method | Install the `binance` package and choose the correct exported client; this is a different package from similarly named Binance libraries. |
| Invalid symbol | Check Spot versus USD-M or COIN-M futures, and query that product's exchange information. |
| Signature or key error | Match the key, market, environment, permissions and IP restrictions. |
| Timestamp outside receive window | Synchronize the host clock and inspect latency before adjusting `recvWindow`. |
| HTTP 429 or IP-ban response | Respect the server's retry guidance and current rate limits; avoid immediate retry loops. |
| No WebSocket ticker events | Register `message` before subscribing, use the Spot subscription helper and inspect `exception`. |
| Local book diverges | Rebuild it using the documented snapshot/update-ID procedure. |
| Process stays alive | Call `closeAll()` and clear application timers during shutdown. |

## Installation and imports

Confirm the installed package with `npm ls binance`. Use `.mjs` for the JavaScript Quickstart or compile the TypeScript examples. Check that the imported client exists in the [API reference](/reference) for the version you installed.

<!--@include: @/.vitepress/shared/troubleshooting/reproduction.md-->

## More help

- [Error handling](/guides/errors)
- [Production usage](/guides/production)
- [Binance SDK issues](https://github.com/sieblyio/binance/issues)
- [Siebly support](https://siebly.io/support)
