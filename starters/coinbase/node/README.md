# Coinbase: Node.js / JavaScript

A runnable public-price example using `coinbase-api`. No API key is required.

Use Node.js 24 and npm.

## Run

From this folder:

```sh
npm install
npm start
```

To stream WebSocket prices until Ctrl+C:

```sh
npm run stream
```

For CommonJS instead, run `node price.cjs` or `node stream.cjs`.

These examples use Advanced Trade public market data. Keep credentialed calls on your Node.js server.

[Follow the complete step-by-step guide](https://sieblyio.github.io/docs/coinbase/environments/node.html).
