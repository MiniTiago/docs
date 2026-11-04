---
title: "Bybit SDK troubleshooting"
description: "Diagnose Bybit installation, authentication, response and WebSocket problems."
---

# Troubleshooting

Start with the symptom, then check the request's market and environment. Reproduce problems with a public request where possible.

## Common symptoms

| Symptom | What to check |
| --- | --- |
| Promise resolves, but the operation failed | Inspect `retCode` and `retMsg`; default REST behaviour does not throw on nonzero `retCode`. |
| Empty ticker list | Check the symbol and `category`. Verify the instrument exists in that market and environment. |
| API key or permission error | Match the key to live, Testnet or demo; check account permissions and IP restrictions. |
| Timestamp or receive-window error | Synchronize the host clock, check network latency, and review `recv_window`. |
| HTTP or rate-limit rejection | Inspect HTTP status and exchange code separately; slow down using the current endpoint limits. |
| No WebSocket market data | Register an `update` listener before subscribing; inspect `exception`, topic and category. |
| Old data after a reconnect | Reconcile application state and apply the topic's snapshot/delta rules. |
| Process stays alive | Close WebSocket connections with `closeAll()` and clear application timers. |

## Installation and imports

Confirm the installed package with `npm ls bybit-api`. Use `.mjs` for the JavaScript Quickstart or compile the TypeScript examples. Check that the imported client exists in the [API reference](/reference) for the version you installed.

<!--@include: @/.vitepress/shared/troubleshooting/reproduction.md-->

## More help

- [Error handling](/guides/errors)
- [Production usage](/guides/production)
- [Bybit SDK issues](https://github.com/sieblyio/bybit-api/issues)
- [Siebly support](https://siebly.io/support)
