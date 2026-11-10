# Coinbase: React Native / Expo

A runnable public-price example using `coinbase-api`. No API key is required.

Use Node.js 24 and npm.

## Run

From this folder:

```sh
npm install
npm start
```

Open the project in a matching Expo Go installation. Press **i** for an iOS simulator or **a** for an Android emulator.

Use **Stop stream** to close the price subscription.

These examples use Advanced Trade public market data. Keep credentialed calls on your Node.js server.

Retain `coinbase-public-auth.cjs` and both Metro files: they supply the public-data configuration and exclude Node-only JWT signing.

[Follow the complete step-by-step guide](https://sieblyio.github.io/docs/coinbase/environments/expo.html).
