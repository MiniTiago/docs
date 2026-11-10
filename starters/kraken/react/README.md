# Kraken: React

A runnable public-price example using `@siebly/kraken-api`. No API key is required.

Use Node.js 24 and npm.

## Run

From this folder:

```sh
npm install
npm run dev
```

Use **Stop stream** to close the price subscription.

The public GET client removes the SDK’s `UserAgent` and `locale` headers to avoid Kraken’s failing CORS preflight. Keep this configuration for these public reads only. Run authenticated REST calls on your server, never in a browser bundle. See the guide for the server-side alternative.

[Follow the complete step-by-step guide](https://sieblyio.github.io/docs/kraken/environments/react.html).
