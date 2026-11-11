# Coinbase: Deno

A runnable public-price example using `coinbase-api`. No API key is required.

Install Deno first.

## Run

From this folder:

```sh
deno install
deno task start
```

To stream WebSocket prices until Ctrl+C:

```sh
deno task stream
```

These examples use Advanced Trade public market data. Keep credentialed calls on your Node.js server.

[Follow the complete step-by-step guide](https://sieblyio.github.io/docs/coinbase/environments/deno.html).
