# Coinbase: React

A runnable public-price example using `coinbase-api`. No API key is required.

Use Node.js 24 and npm.

## Run

From this folder:

```sh
npm install
npm run dev
```

Use **Stop stream** to close the price subscription.

These examples use Advanced Trade public market data. Keep credentialed calls on your Node.js server.

Keep `sdk.vite.config.js`: it excludes Node-only JWT signing from this public-data application. Browser REST access depends on Coinbase CORS policy.

[Follow the complete step-by-step guide](https://sieblyio.github.io/docs/coinbase/environments/react.html).
