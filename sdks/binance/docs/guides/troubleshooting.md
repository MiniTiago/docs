---
title: "Binance SDK troubleshooting"
description: "Diagnose Binance installation, authentication, response and WebSocket problems."
---

# Troubleshooting

## Common symptoms

| Symptom | What to check |
| --- | --- |
| Import or missing method | Install the [`binance`](https://www.npmjs.com/package/binance) package and choose the correct exported client; this is a different package from similarly named Binance libraries. |
| Invalid symbol | Check Spot versus USD-M or COIN-M futures, and query that product's exchange information. |
| Signature or key error | Match the key, market, environment, permissions and IP restrictions. |
| Timestamp outside receive window | Synchronize the host clock and inspect latency before adjusting `recvWindow`. |
| HTTP 429 or IP-ban response | Respect the server's retry guidance and current rate limits; avoid immediate retry loops. |
| No WebSocket ticker events | Register `message` before subscribing, use the Spot subscription helper and inspect `exception`. |
| Local book diverges | Rebuild it using the documented snapshot/update-ID procedure. |
| Process stays alive | Call `closeAll()` and clear application timers during shutdown. |

## Installation and imports

Run `npm ls binance` to check the installed version. The JavaScript Quickstart uses `.mjs`; the TypeScript examples need a compiler or runner. Check exported clients in the [API reference](/reference).

<!--@include: @/.vitepress/shared/troubleshooting/reproduction.md-->

## More help

- [Error handling](/guides/errors)
- [Production usage](/guides/production)
- [Binance SDK issues](https://github.com/sieblyio/binance/issues)
- [Siebly support](https://siebly.io/support)
