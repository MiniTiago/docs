---
title: "Bybit SDK API reference"
description: "Public client methods, parameters and response types for bybit-api."
---

# API reference

Client methods, parameters and response types exported by `bybit-api`. The same API works in JavaScript and TypeScript.

## Clients

- [RestClientV5](/api/classes/RestClientV5)
- [WebsocketClient](/api/classes/WebsocketClient)
- [WebsocketAPIClient](/api/classes/WebsocketAPIClient)

## Common methods

| Task | Method |
| --- | --- |
| Read a Spot ticker | [`getTickers()`](/api/classes/RestClientV5#gettickers) |
| Read a Spot order book | [`getOrderbook()`](/api/classes/RestClientV5#getorderbook) |
| Subscribe to ticker updates | [`subscribeV5()`](/api/classes/WebsocketClient#subscribev5) |
| Close streaming connections | [`closeAll()`](/api/classes/WebsocketClient#closeall) |

Search methods and types with **⌘K / Ctrl+K**.

[All exports](/api/) · [Bybit tutorial](https://siebly.io/sdk/bybit/javascript/tutorial) · [Upstream API documentation](https://bybit-exchange.github.io/docs/v5/intro)
