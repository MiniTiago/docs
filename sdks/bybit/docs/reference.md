---
title: "Bybit SDK API reference"
description: "Public client methods, parameters and response types for bybit-api."
---

# API reference

Browse the public exports of `bybit-api`. JavaScript and TypeScript use the same client methods and parameter objects.

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

Use **Search** or press **⌘K / Ctrl+K** to find methods and types within this SDK. The SDK menu switches to another package's documentation.

[All exports](/api/) · [Bybit tutorial](https://siebly.io/sdk/bybit/javascript/tutorial) · [Upstream API documentation](https://bybit-exchange.github.io/docs/v5/intro)
